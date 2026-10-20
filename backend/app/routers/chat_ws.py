"""Streaming del chat por WebSocket.
Protocolo: cliente envía {"message": "...", "chat_id": "..."}
Servidor responde con eventos: {"type": "token"|"citation"|"done"|"error", ...}
"""
import asyncio
import json
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from jose import JWTError
from app.auth import decode_token
from app.config import settings
from app.database import SessionLocal
from app import models
from app.services import rag, classifier, tickets, pii, cache, prompt_guard
from app.services.audit import log_action
from app import observability

router = APIRouter()

async def _auth(token: str, db: Session):
    try:
        payload = decode_token(token)
    except Exception:
        return None
    if payload.get("kind") != "access":
        return None
    return db.query(models.User).filter(
        models.User.id == payload["sub"], models.User.is_active.is_(True)
    ).first()

@router.websocket("/api/v1/chat/ws")
async def chat_ws(ws: WebSocket):
    token = ws.query_params.get("token")
    if not token:
        await ws.close(code=4401)
        return

    db = SessionLocal()
    try:
        user = await _auth(token, db)
        if not user:
            await ws.close(code=4401)
            return
        await ws.accept()
        observability.ACTIVE_WS.inc()

        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            guard = prompt_guard.check(data.get("message", ""))
            if not guard.ok:
                await ws.send_json({"type": "error", "detail": f"rechazado: {guard.reason}"})
                continue
            message = (data.get("message") or "").strip()
            if not message:
                await ws.send_json({"type": "error", "detail": "mensaje vacío"})
                continue

            chat_id = data.get("chat_id")
            if chat_id:
                chat = db.query(models.ChatHistory).filter(
                    models.ChatHistory.id == chat_id,
                    models.ChatHistory.user_id == user.id,
                ).first()
            else:
                chat = models.ChatHistory(user_id=user.id, title=message[:60])
                db.add(chat); db.commit(); db.refresh(chat)
                await ws.send_json({"type": "chat_id", "chat_id": str(chat.id)})

            user_msg = models.ChatMessage(chat_id=chat.id, role="user", content=pii.redact(message))
            db.add(user_msg); db.commit()

            # Streaming simulado por chunks (Ollama no siempre streamea en LangChain)
            rag_result = await asyncio.to_thread(rag.answer, message)
            answer = rag_result["answer"]
            citations = rag_result["citations"]

            # Enviar tokens
            chunk_size = 24
            for i in range(0, len(answer), chunk_size):
                await ws.send_json({"type": "token", "text": answer[i:i + chunk_size]})
                await asyncio.sleep(0.01)

            for c in citations:
                await ws.send_json({"type": "citation", "citation": c})

            cls = classifier.classify(message)
            is_incident = cls["is_incident"] and cls["confidence"] >= settings.incident_confidence_threshold
            ticket_id = None
            if is_incident:
                ticket = tickets.create_ticket(
                    db, title=f"[{cls['category']}] {message[:80]}",
                    description=pii.redact(message), category=cls["category"],
                    severity=cls["severity"], reported_by=user.id, chat_id=chat.id,
                    metadata={"confidence": cls["confidence"], "source": "chatbot-ws"},
                )
                ticket_id = str(ticket.id)
                observability.INCIDENTS.labels(cls["category"], cls["severity"]).inc()
                await ws.send_json({"type": "ticket", "ticket_id": ticket_id,
                                    "ticket_number": ticket.ticket_number,
                                    "severity": ticket.severity})

            assistant_msg = models.ChatMessage(
                chat_id=chat.id, role="assistant", content=answer,
                citations=citations, intent=cls["category"] if is_incident else "consulta",
                confidence=cls["confidence"], latency_ms=rag_result["latency_ms"],
            )
            db.add(assistant_msg); db.commit(); db.refresh(assistant_msg)

            log_action(db, user_id=user.id, module="chat", action="ws_message",
                       entity="chat", entity_id=str(chat.id),
                       input_data={"len": len(message), "is_incident": is_incident})

            await ws.send_json({
                "type": "done",
                "message_id": str(assistant_msg.id),
                "chat_id": str(chat.id),
                "latency_ms": rag_result["latency_ms"],
                "cached": rag_result.get("cached", False),
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "detail": str(e)})
        except Exception:
            pass
    finally:
        observability.ACTIVE_WS.dec()
        db.close()