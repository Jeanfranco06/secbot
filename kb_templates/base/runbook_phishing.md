# Runbook de Respuesta ante Phishing e Ingeniería Social (v1.0)

**Referencia:** Basado en NIST SP 800-61 Rev. 2 (Computer Security Incident Handling Guide), SANS Incident Handler's Handbook e INCIBE.
**Severidad por defecto:** P2 (Phishing dirigido o con interacción) / P3 (Intento de phishing reportado sin clic).
**Categoría de incidente:** `phishing`

## 1. Cómo Identificar y Reportar un Correo de Phishing
¿Cómo reporto un correo de phishing? **Reenviando el correo a jean20francisco06@gmail.com y creando un ticket** de incidente en SecBot o a través del botón de reporte de phishing del cliente de correo.

Indicadores habituales de un correo de phishing, smishing (SMS) o vishing (llamada):
- Remitente desconocido o con dominio que imita al oficial (ej. `@ernpresa.com` en lugar de `@empresa.com`).
- Sentido de urgencia extrema (facturas vencidas, suspensión de cuenta, bloqueo de nómina o solicitud urgente de un directivo / fraude del CEO).
- Enlaces que apuntan a páginas externas que solicitan usuario, contraseña o código MFA.
- Archivos adjuntos inesperados con extensiones `.zip`, `.rar`, `.iso`, `.html`, `.exe` o documentos con macros.

## 2. Acciones Inmediatas para el Usuario (Qué Hacer y Qué NO Hacer)
Si recibes un correo sospechoso:
1. **NO hagas clic** en ningún enlace ni botón incluido en el mensaje.
2. **NO descargues ni abras** los archivos adjuntos.
3. **NO respondas** al remitente ni reenvíes el mensaje a tus compañeros de trabajo.
4. **Reporta el correo inmediatamente:** Reenviando el correo a `jean20francisco06@gmail.com` (preferiblemente como archivo adjunto `.eml` para conservar las cabeceras originales) y creando un ticket en SecBot.

## 3. Qué Hacer si Hiciste Clic o Ingresaste tus Credenciales (Contención de Emergencia)
Si por error hiciste clic en el enlace malicioso, ingresaste tu contraseña o descargaste un archivo adjunto:
1. **Desconecta el equipo de la red** (apaga el Wi-Fi y desconecta el cable Ethernet) inmediatamente si descargaste o ejecutaste algún archivo.
2. **Cambia tu contraseña corporativa** desde otro dispositivo seguro y revoca las sesiones activas.
3. **Notifica con prioridad urgente (Severidad P2):** Abre un ticket en SecBot indicando que hubo interacción con el enlace o entrega de credenciales, o llama directamente a la línea de guardia del SOC / Seguridad (`jean20francisco06@gmail.com`).

## 4. Procedimiento para el Analista de Seguridad (SOC / NIST SP 800-61)
### Fase 1: Triaje y Análisis
- Analizar cabeceras (`SPF`, `DKIM`, `DMARC`, `Return-Path`, IP de origen) del correo recibido en `jean20francisco06@gmail.com`.
- Inspeccionar URLs y hashes SHA-256 de adjuntos en sandbox segura y fuentes de inteligencia de amenazas (VirusTotal, URLhaus).

### Fase 2: Contención
- **Si el usuario entregó credenciales:** Forzar caducidad de tokens de sesión (`sessions`), restablecer contraseña en directorio activo, revocar tokens OAuth y verificar reglas de reenvío ocultas en el buzón del usuario.
- **Si se ejecutó un adjunto malicioso:** Aislar el endpoint en el EDR y escalar a investigación de malware.
- **Bloqueo perimetral:** Bloquear el dominio/URL en el proxy DNS/firewall y el remitente en la pasarela de correo.

### Fase 3: Erradicación y Recuperación
- Buscar en los registros del servidor de correo todos los buzones que recibieron el mismo mensaje (por `Message-ID`, asunto o remitente) y purgar el correo de todas las bandejas de entrada.
- Confirmar que no existan inicios de sesión no autorizados desde IPs anómalas en las últimas 48 horas antes de cerrar el ticket.
