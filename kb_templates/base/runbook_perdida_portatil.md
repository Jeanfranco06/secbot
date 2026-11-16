# Runbook de Pérdida o Robo de Portátil, Móvil o Dispositivo (v1.0)

**Referencia:** Basado en INCIBE (Gestión de incidentes en dispositivos móviles y portátiles) y NIST SP 800-61.
**Severidad por defecto:** P3 (Dispositivo cifrado sin datos críticos locales) / P2 (Dispositivo con acceso privilegiado o sin confirmar cifrado).
**Categoría de incidente:** `dispositivo`

## 1. Alcance
Aplica ante la pérdida, extravío o robo de cualquier equipo corporativo o personal autorizado (BYOD): ordenador portátil, smartphone, tablet, llave de seguridad física (FIDO2) o soporte USB corporativo cifrado.

## 2. Pasos Obligatorios para el Empleado (Primeras 2 Horas)
El tiempo es crítico para impedir el acceso a la información corporativa. Si pierdes o te roban un equipo:
1. **Reporta de inmediato (máximo en las primeras 2 horas):** Crea un ticket de incidente en SecBot desde otro equipo o comunícate con Seguridad (`jean20francisco06@gmail.com`) y Soporte TI. No esperes a ver si el equipo "aparece más tarde".
2. **Proporciona los datos clave en el reporte:**
   - Tipo de dispositivo (portátil, móvil corporativo, móvil BYOD, memoria USB).
   - Lugar, fecha y hora aproximada de la pérdida o robo.
   - Si el equipo se encontraba encendido, suspendido o apagado, y si tenía el cifrado BitLocker/FileVault activo.
3. **Cambia tu contraseña corporativa** y cierra todas las sesiones activas de inmediato.
4. **Denuncia policial (en caso de robo):** Si se trata de un robo o hurto fuera de las instalaciones, interpón la denuncia ante las autoridades locales y adjunta una copia del acta al ticket de seguridad para trámites de seguro y auditoría de cumplimiento.

## 3. Procedimiento Técnico para TI y Seguridad (SOC)
### Fase 1: Contención Remota
1. **Bloqueo y borrado remoto (Remote Wipe):** Desde la consola MDM / EDR, enviar inmediatamente la orden de bloqueo de equipo y borrado remoto del almacenamiento o contenedor corporativo.
2. **Revocación de credenciales y certificados:**
   - Revocar todos los tokens de sesión activos del usuario (`sessions`).
   - Revocar el certificado de cliente VPN y certificados Wi-Fi corporativos instalados en el dispositivo extraviado.
   - Bloquear la dirección MAC / identificador de hardware del equipo en la red corporativa.

### Fase 2: Evaluación de Impacto y Cumplimiento
1. Verificar en el inventario de activos el estado del cifrado de disco (BitLocker/FileVault) en el último reporte del agente.
2. **Si el dispositivo NO estaba cifrado** o contenía datos personales/confidenciales sin cifrar:
   - Elevar inmediatamente el incidente a **Severidad P1/P2**.
   - Notificar al Oficial de Protección de Datos (DPO) para evaluar la obligación de notificación de brecha de datos personales a la autoridad de control en un plazo máximo de **72 horas** (RGPD / normativa local de protección de datos).
3. Registrar todas las evidencias en el ticket y en el log de auditoría (`audit_log`).
