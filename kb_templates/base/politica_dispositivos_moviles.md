# Política de Dispositivos Móviles y Teletrabajo (BYOD) (v1.0)

**Referencia:** Basado en INCIBE (Política de seguridad para dispositivos móviles y teletrabajo) y SANS Mobile Device Security Policy.
**Versión:** 1.0
**Clasificación:** Uso Interno

## 1. Objetivo
Regular las medidas técnicas y organizativas de seguridad aplicables al uso de ordenadores portátiles, smartphones y tablets (tanto corporativos como personales bajo modalidad BYOD) cuando acceden a redes, aplicaciones o datos de la organización fuera de las oficinas.

## 2. Cifrado y Bloqueo de Dispositivos
Todo dispositivo móvil o portátil que almacene o acceda a información corporativa debe cumplir obligatoriamente con:
- **Cifrado completo de disco:** Activación obligatoria de **BitLocker** (Windows), **FileVault** (macOS) o cifrado nativo de almacenamiento en iOS y Android.
- **Bloqueo automático de pantalla:** Configurado para activarse tras un máximo de **3 minutos de inactividad** en smartphones/tablets y **5 minutos** en ordenadores portátiles.
- **Autenticación del dispositivo:** Uso de PIN alfanumérico de al menos 6 dígitos, contraseña robusta o biometría (huella dactilar / reconocimiento facial). No se permiten patrones de dibujo simples.

## 3. Conexiones de Red y Uso de VPN en Teletrabajo
- **Uso obligatorio de VPN:** Siempre que se trabaje desde fuera de la red corporativa (domicilio, hoteles, aeropuertos o espacios de coworking), es obligatorio establecer conexión mediante la **VPN corporativa** con autenticación multifactor (MFA).
- **Redes Wi-Fi públicas:** Se prohíbe conectarse a redes Wi-Fi públicas abiertas sin cifrado. En caso de emergencia laboral, debe utilizarse compartición de datos móviles (*hotspot* 4G/5G con contraseña WPA2/WPA3) junto con la VPN corporativa activa.
- **Bluetooth y AirDrop:** Deben permanecer desactivados o en modo "no visible" cuando se transite por lugares públicos.

## 4. Gestión de Dispositivos Personales (BYOD)
Los empleados autorizados a consultar correo o aplicaciones corporativas desde su smartphone personal deben:
1. Enrolar el perfil de trabajo en la plataforma **MDM/MAM corporativa**, que separa en un contenedor cifrado los datos de la empresa de los datos personales.
2. Mantener el sistema operativo actualizado a la última versión de seguridad disponible.
3. No utilizar dispositivos con *jailbreak* o *root* (el sistema bloqueará automáticamente el acceso).
4. Aceptar el **borrado remoto selectivo** de la partición corporativa en caso de robo, extravío del dispositivo o finalización de la relación laboral.

## 5. Protección Física durante Desplazamientos
- Nunca dejes ordenadores portátiles o teléfonos corporativos sin supervisión en vehículos, cafeterías, salas de espera o habitaciones de hotel fuera de la caja fuerte.
- Utiliza filtros de privacidad en la pantalla del portátil cuando trabajes en transporte público (aviones, trenes) para evitar el espionaje visual (*shoulder surfing*).
- En caso de pérdida o robo, sigue de inmediato el **Runbook de Pérdida o Robo de Portátil / Dispositivo**.
