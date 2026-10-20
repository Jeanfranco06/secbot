"""
Carga objetivo Fase 2: 1,000 usuarios concurrentes en /chat/messages.
Ejecutar:
  locust -f ops/locustfile.py --host https://api.secbot.empresa.local \
         --users 1000 --spawn-rate 50 --run-time 10m --headless \
         --html report.html
"""
import os
import random
import uuid

from locust import HttpUser, task, between, events

SEED_USER = os.getenv("LOAD_USER_EMAIL", "loadtest@empresa.local")
SEED_PASS = os.getenv("LOAD_USER_PASSWORD", "loadtest123")

QUESTIONS = [
    "¿Cuál es la política de contraseñas?",
    "¿Cómo reporto un correo de phishing?",
    "¿Qué hago si pierdo el portátil?",
    "¿Puedo usar USB personales?",
    "¿Cómo me conecto a la VPN?",
    "¿Cuánto dura la rotación de contraseñas?",
    "¿Cómo activo MFA?",
    "¿Qué es un incidente de seguridad?",
]

INCIDENTS = [
    "Recibí un correo sospechoso de un banco, ¿es phishing?",
    "Perdí mi USB con datos de clientes.",
    "Mi contraseña aparece en una filtración.",
    "Vi un proceso raro en mi equipo, parece malware.",
]

class ChatUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        r = self.client.post("/api/v1/auth/login",
                             json={"email": SEED_USER, "password": SEED_PASS})
        if r.status_code != 200:
            raise RuntimeError(f"Login falló: {r.status_code} {r.text}")
        self.token = r.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(7)
    def consulta(self):
        q = random.choice(QUESTIONS)
        self.client.post("/api/v1/chat/messages",
                         json={"message": q, "chat_id": None},
                         headers=self.headers, name="/chat/messages [consulta]")

    @task(2)
    def incidente(self):
        q = random.choice(INCIDENTS)
        self.client.post("/api/v1/chat/messages",
                         json={"message": q, "chat_id": None},
                         headers=self.headers, name="/chat/messages [incidente]")

    @task(1)
    def historial(self):
        self.client.get("/api/v1/chat/history", headers=self.headers)


@events.quitting.add_listener
def _(environment, **kw):
    stats = environment.stats.total
    p95 = stats.get_response_time_percentile(0.95)
    print(f"\n>>> p95 global: {p95} ms")
    print(f">>> fallos: {stats.fail_ratio * 100:.2f}%")