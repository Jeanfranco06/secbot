# Política de Contraseñas y Autenticación (v2.1)

**Referencia:** Basado en directrices de INCIBE (Políticas de seguridad para la pyme: Gestión de contraseñas), SANS Password Protection Policy y NIST SP 800-63B.
**Versión:** 2.1
**Clasificación:** Uso Interno

## 1. Objetivo y Alcance
Establecer los requisitos mínimos de seguridad para la creación, uso, almacenamiento y protección de contraseñas y mecanismos de autenticación en todos los sistemas, aplicaciones, redes y servicios corporativos de la organización. Aplica a todos los empleados, contratistas y terceros con acceso a activos de información.

## 2. Requisitos de Longitud y Complejidad
¿Cuántos caracteres debe tener una contraseña? **Mínimo 12 caracteres según la Política de Contraseñas v2.1** para cuentas de usuario estándar, y un **mínimo de 16 caracteres** para cuentas de administrador o acceso privilegiado.

Reglas obligatorias de construcción:
- **Longitud mínima:** Mínimo 12 caracteres según la Política de Contraseñas v2.1. Se recomienda el uso de frases de paso (*passphrases*) de 4 o más palabras aleatorias.
- **Composición:** Debe combinar letras mayúsculas, letras minúsculas, números y caracteres especiales (`!@#$%^&*()-_=+`).
- **Palabras prohibidas:** Queda prohibido usar nombres propios, apellidos, nombre de la empresa, fechas de nacimiento, secuencias de teclado (`qwerty`, `123456`) o contraseñas previamente filtradas en brechas públicas (*HaveIBeenPwned*).

## 3. Uso Único y Prohibición de Reutilización
- Cada empleado debe utilizar una **contraseña única** para su cuenta corporativa (Active Directory / SSO).
- Está estrictamente **prohibido reutilizar la contraseña corporativa** en servicios personales, redes sociales, foros o tiendas en línea.
- El sistema recuerda las últimas 12 contraseñas utilizadas y no permite repetirlas.

## 4. Doble Factor de Autenticación (MFA / 2FA)
El uso de **Autenticación Multifactor (MFA)** es **obligatorio** en los siguientes servicios:
1. Correo electrónico corporativo y suite ofimática en la nube.
2. Acceso remoto mediante **VPN corporativa**.
3. Paneles de administración, servidores, consolas cloud y herramientas de seguridad (SIEM, EDR).
4. Aplicaciones críticas financieras y de Recursos Humanos.

Se deben emplear aplicaciones autenticadoras aprobadas (TOTP / notificaciones push con coincidencia de número) o llaves físicas de seguridad FIDO2. No se recomienda el uso de SMS salvo como último recurso autorizado.

## 5. Custodia Segura y Gestor de Contraseñas
- Las contraseñas son **personales e intransferibles**. Ningún miembro de Soporte TI ni del equipo de Seguridad solicitará jamás tu contraseña por correo, chat o teléfono.
- Queda prohibido anotar contraseñas en papel (*post-its*), libretas, archivos de texto sin cifrar o documentos de Excel/Word.
- Se debe utilizar exclusivamente el **Gestor de Contraseñas Corporativo** homologado por el área de Seguridad para almacenar y generar credenciales.

## 6. Caducidad, Bloqueo y Compromiso de Credenciales
- **Bloqueo por intentos fallidos:** La cuenta se bloqueará temporalmente tras **5 intentos fallidos consecutivos** durante 30 minutos o hasta validación con Soporte TI.
- **Rotación y sospecha de compromiso:** Siguiendo NIST SP 800-63B, el cambio inmediato es obligatorio ante cualquier sospecha o alerta de **contraseña comprometida**, filtración de credenciales o inicio de sesión no reconocido.
- Si sospechas que tu contraseña ha sido expuesta o ingresada en una página fraudulenta de phishing, cámbiala de inmediato desde un equipo seguro, cierra todas las sesiones activas y reporta el incidente a `jean20francisco06@gmail.com` o mediante un ticket en SecBot (Severidad P2).
