"""Agente RAG con tools: búsqueda, creación de ticket, escalado a humano.
Solo se usa cuando el usuario pide acciones explícitas ("crea un ticket", "escala").
"""
import logging
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import Tool
from langchain_ollama import OllamaLLM
from langchain_core.prompts import PromptTemplate

from app.config import settings
from app.services import rag

log = logging.getLogger(__name__)

AGENT_PROMPT = """Eres el asistente interno de seguridad.
Tienes acceso a estas herramientas:

{tools}

Usa el formato:
Question: la pregunta del usuario
Thought: razona qué hacer
Action: una de [{tool_names}]
Action Input: input para la acción
Observation: resultado
... (repite si hace falta)
Thought: ya tengo la respuesta
Final Answer: respuesta final en español, con citas [n] si usaste el buscador

Pregunta: {input}
Thought:{agent_scratchpad}"""


def _search_tool() -> Tool:
    def _run(query: str) -> str:
        hits = rag.retrieve(query)
        if not hits:
            return "Sin resultados en la KB."
        return "\n\n".join(
            f"[{i+1}] {h['title']} v{h['version']} — {h.get('section') or 'General'}\n{h['content']}"
            for i, h in enumerate(hits)
        )
    return Tool(
        name="buscar_kb",
        description="Busca en las políticas, runbooks y FAQ internas. Input: la pregunta.",
        func=_run,
    )


def _escalate_tool() -> Tool:
    def _run(reason: str) -> str:
        return f"Escalado a humano registrado. Motivo: {reason}"
    return Tool(
        name="escalar_humano",
        description="Solicita intervención humana. Input: motivo breve.",
        func=_run,
    )


def build_agent():
    llm = OllamaLLM(
        base_url=settings.ollama_base_url,
        model=settings.llm_model,
        temperature=0.0,
        timeout=settings.llm_timeout_seconds,
    )
    tools = [_search_tool(), _escalate_tool()]
    prompt = PromptTemplate.from_template(AGENT_PROMPT)
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, max_iterations=4, handle_parsing_errors=True, verbose=False)


def run(question: str) -> dict:
    try:
        executor = build_agent()
        out = executor.invoke({"input": question})
        return {"answer": out.get("output", ""), "agent": True}
    except Exception as e:
        log.warning("agent_failed", extra={"err": str(e)})
        return {"answer": None, "agent": False}