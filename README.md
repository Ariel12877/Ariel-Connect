# Ariel Connect — starter 0.1

Primera base de desarrollo para la aplicación multiplataforma Ariel Connect.

## Qué incluye
- Interfaz adaptable a computadora y celular.
- PWA instalable (requiere HTTPS en producción; localhost funciona para desarrollo).
- Creación de una identidad demo con código AC-... sin número telefónico.
- Servidor Node.js + Express + Socket.IO.
- Endpoint de salud y creación de grupos de demostración.
- Esqueleto de retransmisión de paquetes cifrados.

## Ejecutar localmente
Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env
npm run dev
```

Abrir http://localhost:3000

## Estado y límites IMPORTANTES
Esta entrega es un **prototipo de interfaz y servidor**, no un mensajero listo para uso real.

Todavía NO están implementados:
- Cifrado de extremo a extremo ni gestión segura de claves.
- Autenticación real de dispositivos, recuperación de cuenta o verificación de identidad.
- Persistencia en PostgreSQL; los usuarios y grupos demo viven en memoria y se pierden al reiniciar.
- Mensajería durable/offline, sincronización multi-dispositivo y notificaciones push.
- Grupos funcionales completos, adjuntos, llamadas ni transporte local Wi-Fi/Bluetooth.
- Controles de abuso, límites de frecuencia, auditoría y pruebas de seguridad.

**No usar para conversaciones privadas ni datos reales.** El código de usuario es un identificador, no una credencial. No desplegar públicamente hasta implementar autenticación, cifrado E2EE, almacenamiento persistente y controles de seguridad revisados.

## Próximas etapas técnicas
1. Persistencia PostgreSQL y esquema de usuarios/dispositivos/grupos.
2. Registro de dispositivos con claves públicas y autenticación por desafío.
3. Integración de un protocolo E2EE mantenido y auditado; claves privadas locales, rotación y verificación de contactos.
4. Mensajería durable con colas y entrega al reconectar.
5. Grupos con distribución/rotación segura de claves.
6. WebRTC para llamadas y pruebas de conectividad (STUN/TURN).
7. Transporte local con módulo nativo; la PWA por sí sola tiene límites de descubrimiento Bluetooth/LAN.
