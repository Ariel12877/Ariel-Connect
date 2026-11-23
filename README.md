# Ariel Connect

Prototipo inicial 0.1.0 de Ariel Connect.

## Ejecutar localmente

Requiere Node.js 20 o superior.

```bash
npm install
npm start
```

Abrir http://localhost:3000.

## Incluido en esta etapa

- Interfaz adaptable a celulares y computadoras.
- Estructura PWA instalable (requiere HTTPS para instalación desde un servidor).
- Servidor Express y Socket.IO.
- Generación de códigos de usuario de demostración.
- Endpoint de estado del servidor.

## Límites importantes

Esta versión NO es una aplicación de mensajería lista para uso real. Los usuarios se guardan en memoria y se pierden al reiniciar. El código generado no es autenticación segura. El canal Socket.IO de demostración no cifra ni autentica mensajes. No hay cifrado de extremo a extremo, almacenamiento persistente, entrega offline, gestión segura de claves, grupos privados reales, llamadas ni conexión local Bluetooth/LAN entre dispositivos.

No enviar información personal ni confidencial. Antes de habilitar conversaciones reales habrá que diseñar autenticación, persistencia, protección contra abuso y cifrado E2EE con un protocolo reconocido y revisado. No implementar criptografía propia.

## Próximas etapas

1. Persistencia PostgreSQL y autenticación segura.
2. Mensajería con cifrado de extremo a extremo y gestión de claves.
3. Conversaciones y grupos privados.
4. Entrega diferida y sincronización entre dispositivos.
5. Llamadas WebRTC y evaluación de conectividad local.
6. Pruebas de seguridad, accesibilidad y despliegue.
