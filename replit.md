# LinguaLearn - Plataforma de Aprendizaje de Idiomas (PWA)

Plataforma educativa estilo Duolingo con gamificación, clases en vivo e IA. Completamente en español, lista para publicación como PWA.

## Stack Tecnológico

- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui + Framer Motion
- **Backend**: Express.js + TypeScript (tsx)
- **Base de datos**: PostgreSQL vía Drizzle ORM
- **Autenticación**: Email/Password propio + Google OAuth + Sesiones de invitado
- **IA**: OpenAI (vía Replit AI Integrations) para ejercicios de conversación
- **PWA**: Service Worker, manifest.json, app shell loading

## Autenticación (Standalone - sin Replit OIDC)

La autenticación es 100% independiente de Replit. Proveedores disponibles:

1. **Email/Password** – Registro y login propios con bcrypt (ruta principal)
2. **Google OAuth** – Opcional, requiere `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
3. **Invitado** – Sesión temporal sin cuenta

`/api/login` redirige a `/login` (página propia, NO Replit OIDC).

### Roles de Usuario
- `student` – Estudiante (por defecto)
- `teacher` – Profesor
- `admin` – Administrador
- `guest` – Invitado

## PWA: Optimización de Carga

- **index.html**: Solo 2 fuentes (DM Sans + Outfit). Antes cargaba 30+ familias.
- **App Shell**: Pantalla de carga HTML mientras React inicializa. Se elimina al montar.
- **Service Worker** (`/public/sw.js`): Estrategias por tipo de recurso:
  - HTML → Network-First (siempre fresco)
  - JS/CSS bundles → Cache-First (hashed, cambian raro)
  - Imágenes/fuentes → Stale-While-Revalidate
  - `/api/*` → Network-Only (sin cachear)
- **Manifest**: 8 tamaños de icono, shortcuts, categorías, orientación portrait
- **Lazy Loading**: Todas las páginas se cargan bajo demanda con React.lazy + Suspense

## Módulos y Páginas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Dashboard | XP, nivel, racha, acciones rápidas. Todo en español. |
| `/path` | Learning Path | Niveles Duolingo-style con zigzag de lecciones |
| `/lesson/:id` | Lesson | 4 preguntas por lección según tipo (conversation/pronunciation/reading) |
| `/classes` | Live Classes | Clases con imagen, fecha en español, inscripción |
| `/ai-practice` | AI Practice | Chat con IA en español, sugerencias de respuesta |
| `/achievements` | Achievements | Logros desbloqueados/bloqueados con XP |
| `/login` | Login | Email/Pass + Guest. Sin branding Replit. |

## Rutas de la API

### Autenticación
- `POST /api/auth/register` – Crear cuenta con email/password
- `POST /api/auth/login` – Login con email/password
- `POST /api/auth/logout` – Cerrar sesión
- `GET /api/auth/user` – Usuario actual
- `GET /api/login` – Redirige a `/login` (legacy redirect, no OIDC)
- `GET /api/auth/google` – (Opcional) Login con Google
- `POST /api/auth/guest` – Crear sesión de invitado
- `GET /api/logout` – Cerrar sesión (redirige a `/login`)

### Contenido
- `GET /api/levels` – Lista de niveles
- `GET /api/levels/:levelId/lessons` – Lecciones por nivel
- `GET /api/lessons/:id` – Lección individual
- `GET /api/progress` – Progreso del usuario (XP, racha)
- `POST /api/progress/xp` – Sumar XP
- `GET /api/achievements` – Todos los logros
- `GET /api/live-classes` – Clases en vivo
- `POST /api/live-classes/:id/register` – Inscribirse a clase
- `POST /api/ai/exercise` – Generar escenario con OpenAI

## Estructura del Proyecto

```
client/
  index.html          – App shell HTML + solo 2 fuentes
  public/
    manifest.json     – PWA manifest completo (8 icons, shortcuts)
    sw.js             – Service worker con estrategias por recurso
    favicon.png       – Icono de la app
  src/
    main.tsx          – Monta React, oculta app shell, registra SW
    App.tsx           – Router con React.lazy + Suspense
    pages/            – Dashboard, LearningPath, Lesson, LiveClasses, AiPractice, Achievements, Login
    components/
      layout.tsx      – Sidebar desktop + bottom nav móvil, todo en español
      gamified-button – Botón 3D estilo Duolingo
    hooks/            – useAuth, useLearning, useAI, useClasses

server/
  routes.ts           – API routes
  storage.ts          – Capa de datos PostgreSQL
  replit_integrations/
    auth/
      replitAuth.ts   – Session, Google OAuth, Guest (sin Replit OIDC)
      routes.ts       – Email/Password auth routes
      storage.ts      – Operaciones de usuario en DB

shared/
  schema.ts           – Drizzle schema (levels, lessons, progress, achievements, liveClasses)
  models/auth.ts      – Tablas users y sessions
  routes.ts           – API contract compartido frontend/backend
```

## Variables de Entorno

- `DATABASE_URL` – PostgreSQL (automática en Replit)
- `SESSION_SECRET` – Secret para sesiones (automática en Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` – OpenAI via Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` – OpenAI base URL via Replit
- `GOOGLE_CLIENT_ID` – (Opcional) Google OAuth
- `GOOGLE_CLIENT_SECRET` – (Opcional) Google OAuth

## Comandos

- `npm run dev` – Desarrollo (puerto 5000)
- `npm run build` – Build para producción
- `npm run db:push` – Sincronizar schema con PostgreSQL
