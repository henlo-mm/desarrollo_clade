# DevManager - Plataforma de Gestión de Proyectos

Plataforma full-stack para gestión de proyectos de desarrollo con integración de IA para descomposición de tareas.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + PrimeReact |
| Backend | Node.js + Express.js |
| Base de datos | MySQL + Sequelize ORM |
| IA | Anthropic Claude (claude-haiku-4-5) |

## Funcionalidades

- **Gestión de Proyectos**: CRUD completo con nombre, descripción, fecha límite y estado
- **Tablero Kanban**: Visualización de tareas por estado (Backlog → En Progreso → Testing → Terminada)
- **Gestión de Tareas**: Título, descripción, prioridad (alta/media/baja), estimación de horas
- **Subtareas**: Lista de verificación con estimaciones individuales
- **Descomposición con IA**: Describe una tarea en lenguaje natural y la IA la divide en subtareas con estimaciones y prioridades
- **Búsqueda de proyectos** y seguimiento de progreso visual

## Requisitos previos

- Node.js 18+
- MySQL 8+
- Cuenta en Anthropic (para la API key de IA)

## Instalación y configuración

### 1. Clonar / descargar el proyecto

```bash
# Si usas git
git clone <repo-url>
cd project-manager
```

### 2. Crear la base de datos MySQL

```sql
CREATE DATABASE project_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env` con tus credenciales:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=project_manager
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql

ANTHROPIC_API_KEY=sk-ant-xxxxxxxx...
```

> **Obtener API key de Anthropic**: Ve a https://console.anthropic.com y crea una API key.

### 4. Instalar dependencias

```bash
# Desde la raíz del proyecto
cd backend && npm install
cd ../frontend && npm install
```

O usando el script raíz:

```bash
npm run install:all
```

### 5. Iniciar en modo desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Servidor en http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App en http://localhost:5173
```

El backend crea/sincroniza las tablas automáticamente al iniciar.

## Estructura del proyecto

```
project-manager/
├── backend/
│   ├── src/
│   │   ├── app.js              # Punto de entrada, servidor Express
│   │   ├── config/
│   │   │   └── database.js     # Configuración Sequelize
│   │   ├── models/
│   │   │   ├── index.js        # Asociaciones entre modelos
│   │   │   ├── Project.js      # Modelo proyecto
│   │   │   ├── Task.js         # Modelo tarea
│   │   │   └── Subtask.js      # Modelo subtarea
│   │   ├── controllers/
│   │   │   ├── projectController.js
│   │   │   ├── taskController.js
│   │   │   ├── subtaskController.js
│   │   │   └── aiController.js
│   │   └── routes/
│   │       ├── index.js
│   │       ├── projects.js
│   │       ├── tasks.js
│   │       ├── subtasks.js
│   │       └── ai.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx            # Punto de entrada React
│   │   ├── App.jsx             # Rutas principales
│   │   ├── index.css           # Estilos globales
│   │   ├── api/                # Clientes HTTP (axios)
│   │   │   ├── client.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   ├── subtasks.js
│   │   │   └── ai.js
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   └── AppLayout.jsx
│   │   │   ├── Projects/
│   │   │   │   └── ProjectFormDialog.jsx
│   │   │   ├── Tasks/
│   │   │   │   ├── TaskCard.jsx
│   │   │   │   └── TaskFormDialog.jsx
│   │   │   └── AI/
│   │   │       └── AIDecomposer.jsx
│   │   └── pages/
│   │       ├── ProjectsPage.jsx
│   │       ├── ProjectDetailPage.jsx
│   │       └── TaskDetailPage.jsx
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
│
└── package.json
```

## API Endpoints

### Proyectos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects` | Listar proyectos |
| POST | `/api/projects` | Crear proyecto |
| GET | `/api/projects/:id` | Obtener proyecto |
| PUT | `/api/projects/:id` | Actualizar proyecto |
| DELETE | `/api/projects/:id` | Eliminar proyecto |

### Tareas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/tasks` | Listar tareas |
| POST | `/api/projects/:projectId/tasks` | Crear tarea |
| GET | `/api/projects/:projectId/tasks/:id` | Obtener tarea |
| PUT | `/api/projects/:projectId/tasks/:id` | Actualizar tarea |
| DELETE | `/api/projects/:projectId/tasks/:id` | Eliminar tarea |

### Subtareas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/tasks/:taskId/subtasks` | Listar subtareas |
| POST | `/api/projects/:projectId/tasks/:taskId/subtasks` | Crear subtarea |
| POST | `/api/projects/:projectId/tasks/:taskId/subtasks/bulk` | Crear subtareas en lote |
| PUT | `/api/projects/:projectId/tasks/:taskId/subtasks/:id` | Actualizar subtarea |
| DELETE | `/api/projects/:projectId/tasks/:taskId/subtasks/:id` | Eliminar subtarea |

### IA
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ai/decompose` | Descomponer tarea con IA |

## Producción

Para desplegar en producción:

```bash
# 1. Build del frontend
cd frontend && npm run build

# 2. Iniciar backend en modo producción
# El backend sirve el frontend estático automáticamente
cd backend
NODE_ENV=production npm start
```

En producción, toda la app estará disponible en `http://localhost:3000`.

## Schema de base de datos

```sql
-- Tablas creadas automáticamente por Sequelize

projects (id, name, description, deadline, status, created_at, updated_at)
tasks (id, project_id, title, description, priority, status, estimated_hours, created_at, updated_at)
subtasks (id, task_id, title, description, priority, estimated_hours, is_completed, created_at, updated_at)
```
