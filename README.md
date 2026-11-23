# Ariel Connect — versión 0.2.0

Segunda etapa: registro persistente con código único, contraseña y sesión.

## Requisitos

- Node.js 20 o superior.
- PostgreSQL 13 o superior.
- Un servicio que mantenga el servidor Node.js activo.

## Instalación

1. Crear una base de datos PostgreSQL para Ariel Connect.
2. Copiar `.env.example` a `.env`.
3. Completar `DATABASE_URL` y generar `SESSION_SECRET` aleatorio de al menos 32 caracteres.
4. Instalar dependencias y crear la tabla:

```bash
npm install
psql "$DATABASE_URL" -f db/migrations/001_users.sql
npm start
```

Abrir `http://localhost:3000`.

En producción configurar `NODE_ENV=production`, HTTPS y `PGSSL=true` únicamente si el proveedor de PostgreSQL requiere TLS. No subir el archivo `.env` ni compartir `SESSION_SECRET`.

## Qué incluye

- Registro de usuario sin número telefónico.
- Código único con formato `AC-XXXXXXXXXX`.
- Contraseña de al menos 12 caracteres, almacenada como hash scrypt con sal individual.
- Inicio y cierre de sesión mediante cookie HttpOnly, SameSite Strict y Secure en producción.
- Sesiones persistentes en PostgreSQL.
- Limitación básica de intentos de registro e inicio de sesión.
- Encabezados de seguridad con Helmet.
- Endpoint `/api/health` que comprueba la base de datos.

## Importante: estado de seguridad

Esta es una etapa de desarrollo, no una aplicación lista para manejar información sensible. El código es un identificador, no un secreto; la contraseña protege el acceso. Todavía no hay recuperación de cuenta, verificación de correo/teléfono (no se solicita teléfono), chat, grupos privados reales, cifrado de extremo a extremo ni llamadas.

El servicio no retransmite mensajes en esta versión. Se quitó el relay de demostración anterior porque no ofrecía cifrado ni autorización adecuada. El chat se agregará cuando esté definido un protocolo E2EE reconocido y un modelo de autorización de conversaciones.

La instalación PWA puede mostrar la interfaz sin conexión, pero el registro y el inicio de sesión necesitan conexión al servidor. No confundir caché de interfaz con mensajería offline.

## Próximos pasos

1. Configurar PostgreSQL y desplegar el backend con variables secretas.
2. Probar registro, cierre y nuevo inicio de sesión.
3. Diseñar recuperación segura de cuenta.
4. Implementar conversaciones y grupos privados con cifrado E2EE basado en un protocolo auditado.
5. Agregar sincronización y entrega diferida.
6. Evaluar WebRTC y conectividad local.
