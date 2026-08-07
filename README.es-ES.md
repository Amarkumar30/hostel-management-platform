

# Plataforma de Gestión de Residencias Estudiantiles

## Despliegue

Para el stack de despliegue en producción recomendado:

- `client/` en Vercel
- `server/` en Render
- Neon para PostgreSQL
- Upstash para Redis

consulte [HOSTING.md]().

Monorepo full-stack de gestión de residencias con:

- `client`: Frontend en React + Vite + TypeScript
- `server`: Backend en NestJS + Prisma + PostgreSQL

El proyecto incluye:

- Autenticación JWT con roles de estudiante, encargado y administrador
- Vistas de listado de habitaciones y asignación de habitaciones
- Reclamos identificados y reclamos anónimos
- Carga de imágenes a través de Cloudinary
- Chatbot de IA a través de Gemini (habilitado para RAG)
- Notificaciones en tiempo real a través de Socket.IO

## Problema Actual de Inicio de Sesión

Si no puedes iniciar sesión, la razón principal es:

- el frontend se ejecuta en `http://localhost:5173`
- pero la API del backend en `http://localhost:3001/api/v1` no es accesible
- el backend no puede iniciarse correctamente hasta que PostgreSQL se esté ejecutando en `localhost:5432`

Las verificaciones anteriores mostraron:

- frontend: accesible
- API del backend: no accesible
- Semilla (seed) de Prisma: falló porque PostgreSQL en `localhost:5432` no estaba disponible

Eso significa que el inicio de sesión fallará hasta que la base de datos esté en ejecución y la migración/carga inicial del backend se complete.

## Estructura del Proyecto

```text
hostel-platform/
├── client/   React frontend
├── server/   NestJS backend
└── README.md
```

## Stack Tecnológico

### Frontend

- React 19
- Vite
- TypeScript
- React Router
- TanStack Query
- Zustand
- Framer Motion
- Recharts
- React Hook Form + Zod
- Socket.IO client

### Backend

- NestJS
- Prisma
- PostgreSQL
- JWT auth
- Socket.IO
- Cloudinary
- LLM

## Roles

- `STUDENT`
- `WARDEN`
- `ADMIN`

## Características Principales

### Estudiante

- Iniciar sesión y registrarse
- Ver asignación actual de habitación
- Enviar reclamos identificados
- Enviar reclamos anónimos
- Rastrear reclamo mediante token
- Usar chatbot de IA

### Encargado

- Ver estadísticas de habitaciones
- Ver actividad de reclamos
- Actualizar estados de reclamos

### Administrador

- Resumen del panel de control
- Gestión de habitaciones
- Administración de reclamos
- Flujo de notificaciones en actualizaciones de reclamos

## Variables de Entorno

### `server/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hostel_platform"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="hostel-jwt-secret-change-in-prod-2026"
JWT_REFRESH_SECRET="hostel-refresh-secret-change-in-prod-2026"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-1.5-flash"
GEMINI_EMBED_MODEL=""
GEMINI_API_BASE_URL="https://generativelanguage.googleapis.com"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
"
HASH_SALT="sau-hostel-anon-salt-2026"
HOSTEL_NAME="SAU International Hostel"
PORT=3001
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### `client/.env`

```env
VITE_API_URL="http://localhost:3001"
VITE_SOCKET_URL="http://localhost:3001"
```

## Prerrequisitos

Instala lo siguiente antes de ejecutar el proyecto:

- Node.js 20+ o superior
- npm
- PostgreSQL ejecutándose localmente en el puerto `5432`
- Base de datos de PostgreSQL llamada `hostel_platform`
- Extensión `pgvector` disponible en PostgreSQL

Opcional pero utilizado por características:

- Redis en `localhost:6379`
- Cuenta de Cloudinary
- Clave API de Gemini (chatbot)

## Configuración de la Base de Datos

### 1. Iniciar PostgreSQL

Asegúrate de que PostgreSQL se esté ejecutando localmente en:

```text
localhost:5432
```

### 2. Crear la base de datos

Ejecuta esto en PostgreSQL:

```sql
CREATE DATABASE hostel_platform;
```

### 3. Habilitar `pgvector`

Dentro de esa base de datos:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Si no se puede crear `vector`, instala primero la extensión `pgvector` para tu instalación de PostgreSQL.

## Instalar Dependencias

Desde la raíz del repositorio:

```bash
cd hostel-platform
```

Instala las dependencias del frontend y del backend:

```bash
cd server
npm install

cd ../client
npm install
```

## Configuración del Backend

Desde `hostel-platform/server`:

### 1. Generar cliente de Prisma

```bash
npx prisma generate
```

### 2. Ejecutar migración

```bash
npx prisma migrate dev --name init
```

### 3. Cargar datos de demostración (seed)

```bash
npx prisma db seed
```

Si la migración o la semilla falla con:

```text
Can't reach database server at localhost:5432
```

entonces PostgreSQL no se está ejecutando o la cadena de conexión en `server/.env` es incorrecta.

## Cuentas de Prueba

Estas se crean mediante el script de semilla:

- Admin: `admin@sau.ac.in` / `admin123`
- Warden: `warden@sau.ac.in` / `warden123`
- Student: `student@sau.ac.in` / `student123`

Importante:

- estas cuentas no existen hasta que `npx prisma db seed` se complete con éxito
- si la semilla falla, el inicio de sesión fallará incluso si el backend se inicia

## Ejecutar la Aplicación

### Iniciar backend

Desde `hostel-platform/server`:

```bash
npm run start:dev
```

URLs esperadas del backend:

- Raíz de la API: `http://localhost:3001/api/v1`
- Documentación Swagger: `http://localhost:3001/api/docs`

### Iniciar frontend

Desde `hostel-platform/client`:

```bash
npm run dev
```

URL esperada del frontend:

- `http://localhost:5173`

## Orden de Ejecución Correcto

Usa este orden:

1. Iniciar PostgreSQL
2. Crear la base de datos `hostel_platform` si falta
3. Habilitar la extensión `vector`
4. Ejecutar `npx prisma generate`
5. Ejecutar `npx prisma migrate dev --name init`
6. Ejecutar `npx prisma db seed`
7. Ejecutar `npm run start:dev` en `server`
8. Ejecutar `npm run dev` en `client`
9. Abrir `http://localhost:5173`
10. Iniciar sesión con `admin@sau.ac.in / admin123`

## Cómo Funciona la Autenticación

Flujo de inicio de sesión del frontend:

- la página de inicio de sesión envía datos a `/auth/login`
- el backend devuelve `accessToken`
- el frontend lo almacena en `localStorage`
- el token de refresco se almacena en una cookie HTTP-only
- las solicitudes posteriores a la API usan `Authorization: Bearer <token>`

Si el inicio de sesión falla, verifica:

- el backend es accesible en el puerto `3001`
- la base de datos está en ejecución
- la migración se completó
- la semilla se completó
- la cuenta de demostración existe

## Rutas Disponibles en el Frontend

### Público

- `/login`
- `/register`
- `/track`

### Protegido

- `/dashboard`
- `/my-room`
- `/complaints`
- `/complaints/anonymous`
- `/rooms`
- `/admin/complaints`
- `/maintenance`

## Endpoints del Backend Implementados

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

### Rooms

- `GET /api/v1/rooms`
- `GET /api/v1/rooms/:id`
- `GET /api/v1/rooms/stats`
- `POST /api/v1/rooms`
- `POST /api/v1/rooms/allocate`
- `DELETE /api/v1/rooms/deallocate/:userId`

### Complaints

- `GET /api/v1/complaints`
- `POST /api/v1/complaints`
- `POST /api/v1/complaints/anonymous`
- `GET /api/v1/complaints/mine`
- `GET /api/v1/complaints/track/:token`
- `PATCH /api/v1/complaints/:id/status`

### Upload

- `POST /api/v1/upload/image`

### Chatbot

- `POST /api/v1/chatbot/message`

### Dashboard

- `GET /api/v1/dashboard/admin-stats`

## Notas sobre Características

### Reclamos Anónimos

- los reclamos anónimos no almacenan `userId` en la fila del reclamo
- la identidad se almacena por separado como un hash salado
- el rastreo ocurre a través del token del reclamo

### Chatbot

- el chatbot utiliza Gemini + RAG basado en embeddings sobre `KnowledgeBase`
- utiliza clasificación básica de intenciones
- lee datos en vivo de habitaciones/reclamos cuando es relevante
- si los embeddings de KB faltan, puede incrustar perezosamente algunas entradas o volver a la búsqueda por palabras clave

### Notificaciones

- las actualizaciones de estado de reclamos crean notificaciones
- las notificaciones se emiten a través de Socket.IO

## Limitaciones Conocidas

- El inicio de sesión no funcionará hasta que PostgreSQL esté en ejecución y se haya cargado la semilla
- Redis está configurado pero no es activamente requerido para el flujo principal actual
- El CRUD de backend de mantenimiento y anuncios no está completamente construido aún
- La carga a Cloudinary necesita credenciales de cuenta válidas
- El chatbot de Gemini necesita una `GEMINI_API_KEY` válida (y idealmente embeddings de KB pre-indexados)

## Solución Rápida de Problemas

### El frontend se abre pero el inicio de sesión falla

Verifica:

- `http://localhost:3001/api/v1` es accesible
- la terminal del backend no tiene errores de conexión de Prisma
- `npx prisma db seed` se completó con éxito

### La migración de Prisma falla

Causas probables:

- PostgreSQL no se está ejecutando
- `DATABASE_URL` incorrecta
- Extensión `pgvector` faltante

### La semilla falla

Causas probables:

- migración no aplicada
- base de datos inaccesible

### La carga falla

Causas probables:

- claves de Cloudinary inválidas
- archivo demasiado grande
- tipo de imagen no compatible

### El chatbot falla

Causas probables:

- falta `GEMINI_API_KEY`
- embeddings de KB no indexados aún (ejecuta `POST /api/v1/chatbot/kb/reindex` como admin/encargado)

## Estado Actual

Qué funciona ahora en el código:

- la compilación del frontend pasa
- la compilación del backend pasa
- el enrutamiento y la UI están implementados
- auth, reclamos, reclamos anónimos, chatbot y notificaciones están conectados

Qué aún bloquea el inicio de sesión real en tu máquina:

- PostgreSQL no es accesible en `localhost:5432`
- la API del backend no está actualmente activa en `localhost:3001`
- los datos de semilla no se han creado con éxito

## Próximos Pasos para Ti

Haz esto primero:

1. Iniciar PostgreSQL
2. Crear la base de datos `hostel_platform`
3. Habilitar la extensión `vector`
4. Ejecutar:

```bash
cd hostel-platform/server
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

Luego en otra terminal:

```bash
cd hostel-platform/client
npm run dev
```

Luego abre:

```text
http://localhost:5173
```

e inicia sesión con:

```text
admin@sau.ac.in / admin123
```
