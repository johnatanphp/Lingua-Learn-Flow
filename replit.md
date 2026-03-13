# LinguaLearn - Plataforma de Aprendizaje de Idiomas

Plataforma educativa estilo Duolingo con gamificación, clases en vivo e IA.

## Stack Tecnológico

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript (tsx)
- **Base de datos**: PostgreSQL vía Drizzle ORM
- **Autenticación**: Replit Auth (OIDC) + Google OAuth + Sesiones de invitado
- **IA**: OpenAI (vía Replit AI Integrations) para ejercicios de conversación

## Autenticación y Roles de Usuario

### Proveedores de Login
1. **Replit** – Login con cuenta Replit (OIDC, activo por defecto)
2. **Google OAuth** – Requiere configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en secrets
3. **Invitado** – Sesión temporal sin cuenta, acceso limitado

### Tipos de Sesión / Roles
- `student` – Estudiante (por defecto): acceso a lecciones, progreso, logros
- `teacher` – Profesor: crea clases en vivo, gestiona alumnos
- `admin` – Administrador: gestión completa de la plataforma
- `guest` – Invitado: exploración con acceso limitado

### Configurar Google OAuth
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear credenciales OAuth 2.0
3. URI de redirección autorizado: `https://<tu-dominio>/api/auth/google/callback`
4. Agregar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en los Secrets de Replit

## Rutas de la API

### Autenticación
- `GET /api/auth/user` – Usuario actual autenticado
- `PATCH /api/auth/user/role` – Cambiar rol del usuario
- `GET /api/auth/providers` – Proveedores disponibles
- `GET /api/login` – Login con Replit
- `GET /api/auth/google` – Login con Google
- `POST /api/auth/guest` – Crear sesión de invitado
- `GET /api/logout` – Cerrar sesión

### Contenido
- `GET /api/levels` – Lista de niveles
- `GET /api/levels/:levelId/lessons` – Lecciones por nivel
- `GET /api/lessons/:id` – Lección individual
- `GET /api/progress` – Progreso del usuario
- `POST /api/progress` – Actualizar XP
- `GET /api/achievements` – Logros disponibles
- `GET /api/user-achievements` – Logros del usuario
- `GET /api/live-classes` – Clases en vivo
- `POST /api/ai/generate-exercise` – Generar ejercicio con IA

## Estructura del Proyecto

```
client/src/
  pages/         – Dashboard, LearningPath, Lesson, LiveClasses, AiPractice, Achievements, Login
  components/    – Layout, GamifiedButton, UI components
  hooks/         – useAuth, useLearning
server/
  routes.ts      – Rutas de la API
  storage.ts     – Capa de datos
  replit_integrations/
    auth/        – Replit Auth + Google OAuth
    chat/        – OpenAI chat
shared/
  schema.ts      – Esquema Drizzle (tablas principales)
  models/auth.ts – Tablas de usuarios y sesiones
```

## Variables de Entorno Necesarias

- `DATABASE_URL` – PostgreSQL connection string (automática en Replit)
- `SESSION_SECRET` – Secret para sesiones (automático en Replit)
- `REPL_ID` – ID del Repl (automático)
- `AI_INTEGRATIONS_OPENAI_API_KEY` – OpenAI via Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` – OpenAI base URL via Replit
- `GOOGLE_CLIENT_ID` – (Opcional) Para login con Google
- `GOOGLE_CLIENT_SECRET` – (Opcional) Para login con Google

## Comandos

- `npm run dev` – Iniciar en desarrollo (puerto 5000)
- `npm run build` – Build para producción
- `npm run db:push` – Sincronizar schema con la base de datos
