# Política de Prevención de Fraude y Seguridad Financiera (v1.0)

**Referencia:** Basado en PCI-DSS v4.0, ISO/IEC 27001 e INCIBE Sector Financiero.
**Versión:** 1.0
**Clasificación:** Confidencial / Uso Interno

## 1. Verificación contra Fraude del CEO y Transferencias (BEC)
- Ninguna orden de transferencia bancaria, cambio de cuenta IBAN de proveedor o pago urgente recibido por correo electrónico o mensajería será ejecutada sin **doble validación por canal alternativo** (llamada telefónica a número registrado en el ERP) y firma mancomunada.
- Cualquier solicitud de pago que invoque confidencialidad extrema o urgencia inusual debe reportarse inmediatamente como posible incidente de **phishing / fraude BEC (Severidad P1/P2)** a `jean20francisco06@gmail.com`.

## 2. Protección de Datos Financieros y Tarjetas (PCI-DSS)
- Queda estrictamente prohibido almacenar, enviar o compartir números completos de tarjetas de pago (PAN), códigos CVV/CVC o PINs a través de correo electrónico, chats o tickets de soporte.
- El acceso a los entornos transaccionales requiere MFA resistente al phishing y sesiones con cierre automático tras 10 minutos de inactividad.
