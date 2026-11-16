# Runbook de Acceso No Autorizado y Compromiso de Cuentas (v1.0)

**Referencia:** Basado en NIST SP 800-61 Rev. 2, CIS Controls v8 y guías de respuesta a incidentes de INCIBE / CCN-CERT.
**Severidad por defecto:** P2 (Alto — Cuenta o sistema con acceso no autorizado).
**Categorías de incidente:** `acceso`, `credenciales`

## 1. Cuándo Activar este Runbook
Este procedimiento debe ejecutarse de inmediato cuando un empleado o el sistema de monitoreo detecte cualquiera de las siguientes señales de alerta:
- Notificaciones de **inicio de sesión sospechoso** desde una ubicación geográfica, país, dirección IP o dispositivo no reconocido.
- Alertas de **MFA no solicitadas** en el teléfono móvil (*MFA Fatigue / Push Bombing*).
- Cambios no autorizados en la configuración de la cuenta (reglas de reenvío de correo, adición de nuevos métodos MFA, envíos de mensajes que el usuario no realizó).
- Confirmación de **contraseña comprometida** o credenciales corporativas expuestas en filtraciones de datos.

## 2. Pasos Inmediatos para el Empleado
1. **RECHAZA cualquier notificación MFA** que aparezca en tu teléfono si tú no estás intentando iniciar sesión en ese momento.
2. **Revoca tus sesiones activas:** Ingresa al panel de sesiones de tu cuenta corporativa (o solicita apoyo inmediato en SecBot) y cierra todas las sesiones abiertas.
3. **Cambia tu contraseña:** Actualiza tu contraseña por una nueva de mínimo 12 caracteres que no hayas usado antes, desde un dispositivo de confianza.
4. **Crea un ticket urgente (Severidad P2):** Reporta el incidente en SecBot o escribe a `jean20francisco06@gmail.com` detallando la hora aproximada de la alerta y el servicio afectado.

## 3. Procedimiento de Respuesta del Equipo de Seguridad (SOC)
### Paso 1: Contención Inmediata (Primeros 15 minutos)
- Suspender temporalmente la cuenta de usuario afectada en el proveedor de identidad (IdP / Active Directory / SSO).
- Invalidar todos los *Refresh Tokens* y sesiones activas en la base de datos (`sessions`) y forzar cierre de sesión global.
- Si el acceso involucró credenciales privilegiadas o de administrador, elevar la severidad a **P1** y rotar secretos/claves de servicio asociadas.

### Paso 2: Investigación y Alcance (Análisis Forense)
- Revisar el registro de auditoría (`audit_log`) y eventos del SIEM para identificar:
  - Dirección IP de origen, `User-Agent` y horario del primer acceso indebido.
  - Acciones realizadas durante la sesión comprometida (descarga de documentos de la KB, exportación de reportes, creación de usuarios, movimientos laterales).
  - Persistencia creada por el atacante (nuevos dispositivos MFA registrados, tokens de API, reglas de bandeja de entrada).

### Paso 3: Erradicación y Restablecimiento Seguro
- Eliminar cualquier método MFA, token o regla de correo creada durante el compromiso.
- Emitir una contraseña temporal segura y verificar la identidad del empleado por videollamada o canal alternativo antes de reactivar la cuenta.
- Monitorear de forma reforzada la actividad del usuario durante los siguientes 14 días.
