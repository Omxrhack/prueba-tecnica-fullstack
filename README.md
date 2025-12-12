# Sistema de Control Escolar

Sistema web full-stack profesional para la gestión integral de calificaciones escolares, diseñado con una arquitectura moderna, interfaz intuitiva y animaciones fluidas.

---

## Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso del Sistema](#-uso-del-sistema)
- [API Endpoints](#-api-endpoints)
- [Modelo de Datos](#-modelo-de-datos)
- [Credenciales de Prueba](#-credenciales-de-prueba)
- [Docker](#-docker)
- [Desarrollo](#-desarrollo)

---

## Descripción General

Sistema completo de gestión escolar que permite a diferentes roles (Administradores, Maestros y Alumnos) gestionar y consultar calificaciones de manera eficiente. El sistema incluye funcionalidades avanzadas como asignación de materias, gestión de calificaciones, reportes estadísticos y una interfaz moderna con animaciones fluidas.

---

## ✨ Características Principales

### 👨‍💼 Panel de Administrador (Control Escolar)
-  Gestión completa de materias, maestros y alumnos
-  Creación y edición de materias con asignación de semestre (1-8)
-  Asignación de maestros a materias
-  Asignación de materias a alumnos (individual o múltiple)
-  Creación de usuarios (Maestro, Alumno, Admin)
-  Edición y eliminación de calificaciones por unidad
-  Vinculación de usuarios a registros de alumnos
-  Reportes globales de promedios por alumno (limitado a 10 estudiantes)
-  Reportes detallados por materia con calificaciones por unidad
-  Vista detallada de alumno con materias cursando, cursadas y faltantes
-  Búsqueda y filtrado avanzado por semestre
-  **Selectores de materias agrupados por semestre** con títulos visuales destacados
-  **Dropdowns interactivos** con funcionalidad de abrir/cerrar automático
-  Filtrado global por semestre (materias, alumnos, reportes)
-  Soft delete de alumnos y materias

### Panel de Maestro
-  Visualización de materias asignadas
-  Gestión de calificaciones por unidad (1-5) para cada alumno
-  Búsqueda y filtrado de alumnos
-  Registro de observaciones por calificación
-  Vista de cupo disponible por materia
-  Visualización de calificaciones previas por unidad

### Panel de Alumno
-  Consulta de calificaciones propias
-  Visualización de promedio general
-  Detalle por materia con información del maestro
-  Historial completo de calificaciones

### Diseño y UX
-  Interfaz moderna con gradientes profesionales
-  Animaciones fluidas y transiciones suaves
-  Diseño responsive (móvil, tablet, desktop)
-  Colores profesionales (Primary, Secondary, Accent)
-  Componentes reutilizables y estilizados
-  Feedback visual en todas las acciones

---

## Arquitectura del Sistema

El proyecto sigue una arquitectura **monorepo** con separación clara entre backend y frontend:

```
prueba-tecnica-fullstack/
├── backend/          # API REST (Node.js + Express)
├── frontend/         # Aplicación Web (React + TypeScript)
└── docker-compose.yml # Orquestación de servicios
```

### Backend (MVC)
- **Models**: Definición de entidades con Sequelize ORM
- **Controllers**: Lógica de negocio
- **Routes**: Definición de endpoints API
- **Middlewares**: Autenticación, validación, manejo de errores
- **Seeders**: Datos de prueba iniciales

### Frontend (Component-Based)
- **Pages**: Vistas principales (Login, Dashboard)
- **Components**: Componentes reutilizables por rol
- **Services**: Lógica de comunicación con API
- **Types**: Definiciones TypeScript
- **Styles**: Configuración Tailwind CSS con temas personalizados

---

## Tecnologías Utilizadas

### Backend
- **Node.js** (v22+) - Runtime JavaScript
- **Express.js** (v5.2) - Framework web
- **PostgreSQL** (v15) - Base de datos relacional
- **Sequelize** (v6.37) - ORM para Node.js
- **JWT** (jsonwebtoken) - Autenticación
- **bcryptjs** - Hash de contraseñas
- **express-validator** - Validación de datos
- **helmet** - Seguridad HTTP
- **morgan** - Logging de requests
- **dotenv** - Gestión de variables de entorno

### Frontend
- **React** (v19.2) - Biblioteca UI
- **TypeScript** (v5.9) - Tipado estático
- **Vite** (v7.2) - Build tool y dev server
- **Tailwind CSS** (v3.4) - Framework CSS utility-first
- **Axios** (v1.13) - Cliente HTTP
- **React Router DOM** (v7.10) - Enrutamiento

### DevOps
- **Docker** - Containerización
- **Docker Compose** - Orquestación de servicios

---

## Estructura del Proyecto

```
prueba-tecnica-fullstack/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js              # Configuración Sequelize
│   │   ├── controllers/
│   │   │   ├── admin.controller.js      # Lógica Admin
│   │   │   ├── alumno.controller.js     # Lógica Alumno
│   │   │   ├── auth.controller.js       # Autenticación
│   │   │   ├── general.controller.js    # Endpoints generales
│   │   │   └── maestro.controller.js    # Lógica Maestro
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js       # Verificación JWT
│   │   │   ├── errorHandler.middleware.js # Manejo de errores
│   │   │   └── validate.middleware.js   # Validación requests
│   │   ├── models/
│   │   │   ├── Alumno.js                # Modelo Alumno
│   │   │   ├── Asignacion.js            # Modelo Asignación
│   │   │   ├── Calificacion.js          # Modelo Calificación
│   │   │   ├── Materia.js               # Modelo Materia
│   │   │   ├── Usuario.js               # Modelo Usuario
│   │   │   └── index.js                 # Asociaciones Sequelize
│   │   ├── routes/
│   │   │   ├── admin.routes.js          # Rutas Admin
│   │   │   ├── alumno.routes.js         # Rutas Alumno
│   │   │   ├── auth.routes.js           # Rutas Auth
│   │   │   ├── general.routes.js        # Rutas Generales
│   │   │   └── maestro.routes.js        # Rutas Maestro
│   │   └── seeders/
│   │       └── runSeeds.js              # Datos iniciales
│   ├── index.js                         # Punto de entrada
│   ├── package.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminDashboard.tsx       # Panel Admin
│   │   │   ├── AlumnoDashboard.tsx      # Panel Alumno
│   │   │   └── MaestroDashboard.tsx     # Panel Maestro
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # Layout principal
│   │   │   └── Login.tsx                # Página de login
│   │   ├── services/
│   │   │   ├── admin.service.ts         # Servicios Admin
│   │   │   ├── alumno.service.ts        # Servicios Alumno
│   │   │   ├── api.ts                   # Configuración Axios
│   │   │   ├── general.service.ts       # Servicios generales
│   │   │   └── maestro.service.ts       # Servicios Maestro
│   │   ├── types/
│   │   │   └── index.ts                 # Tipos TypeScript
│   │   ├── App.tsx                      # Componente raíz
│   │   ├── index.css                    # Estilos globales
│   │   └── main.tsx                     # Punto de entrada
│   ├── tailwind.config.cjs              # Config Tailwind
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml                   # Orquestación Docker
├── .env.example                         # Variables de entorno ejemplo
└── README.md                            # Este archivo
```

---

## Instalación y Configuración

### Prerrequisitos

- **Node.js** >= 18.0.0
- **Docker** y **Docker Compose** (recomendado)
- **PostgreSQL** >= 13 (si no usas Docker)
- **npm** o **yarn**

### Opción 1: Docker (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd prueba-tecnica-fullstack
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus valores:
   ```env
   # Base de Datos
   DB_HOST=db
   DB_USER=postgres
   DB_PASSWORD=tu_password_seguro
   DB_NAME=sistema_escolar
   
   # Backend
   PORT=3000
   JWT_SECRET=tu_jwt_secret_super_seguro
   NODE_ENV=development
   
   # Frontend
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Levantar servicios con Docker Compose**
   ```bash
   docker-compose up -d
   ```

   Esto levantará:
   - PostgreSQL en el puerto 5432
   - Backend API en el puerto 3000
   - Frontend en el puerto 5173

4. **Acceder a la aplicación**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api
   - Health Check: http://localhost:3000/api/health

### Opción 2: Instalación Manual

#### Backend

1. **Navegar al directorio backend**
   ```bash
   cd backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar base de datos**
   - Crear base de datos PostgreSQL
   - Configurar variables de entorno en `.env`

4. **Iniciar servidor**
   ```bash
   npm run dev  # Modo desarrollo con nodemon
   # o
   npm start    # Modo producción
   ```

#### Frontend

1. **Navegar al directorio frontend**
   ```bash
   cd frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar API URL**
   - Editar `.env` con `VITE_API_URL=http://localhost:3000/api`

4. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   - http://localhost:5173

---

## Uso del Sistema

### Inicio de Sesión

1. Accede a http://localhost:5173
2. Ingresa las credenciales (ver sección de credenciales de prueba)
3. Serás redirigido al dashboard correspondiente a tu rol

### Flujo de Trabajo

#### Para Administradores:
1. Crear materias (con semestre 1-8), maestros y alumnos
2. Asignar maestros a materias
3. Asignar alumnos a materias (individual o múltiple) usando selectores agrupados por semestre
4. Gestionar calificaciones por unidad (editar/eliminar unidades específicas)
5. Vincular usuarios a registros de alumnos
6. Consultar reportes globales (hasta 10 estudiantes) y por materia
7. Filtrar materias, alumnos y reportes por semestre
8. Ver detalle completo de cada alumno (materias cursando, cursadas, faltantes por semestre)
9. Navegar selectores de materias organizados por semestre con títulos visuales destacados

#### Para Maestros:
1. Seleccionar una materia asignada
2. Ver lista de alumnos inscritos
3. Registrar o editar calificaciones por unidad (1-5)
4. Agregar observaciones por calificación
5. Ver historial de calificaciones por unidad de cada alumno

#### Para Alumnos:
1. Visualizar todas tus calificaciones agrupadas por materia y unidad
2. Ver promedio general y por semestre
3. Consultar materias cursando (activas), cursadas y faltantes por semestre
4. Ver detalle completo por materia con todas las unidades (1-5)
5. Ver información de semestre actual y materias pendientes

---

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/login` | Iniciar sesión | ❌ Público |

**Request Body:**
```json
{
  "email": "admin@escuela.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "Admin Control Escolar",
    "email": "admin@escuela.com",
    "rol": "CONTROL_ESCOLAR"
  }
}
```

### Control Escolar (Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/controlescolar/reporte` | Reporte global de promedios |
| `GET` | `/api/controlescolar/reporte/:materiaID` | Detalle de calificaciones por materia |
| `POST` | `/api/controlescolar/materias` | Crear materia (con asignación opcional) |
| `POST` | `/api/controlescolar/materias/:materiaID/alumnos` | Asignar alumnos a materia |
| `POST` | `/api/controlescolar/alumnos/:alumnoID/materias` | Asignar múltiples materias a un alumno |
| `POST` | `/api/controlescolar/asignacion` | Asignar maestro a materia |
| `POST` | `/api/controlescolar/usuarios` | Crear usuario (Maestro/Alumno/Admin) |
| `GET` | `/api/controlescolar/alumnos/:alumnoID/detalle` | Obtener detalle completo de alumno |
| `PATCH` | `/api/controlescolar/calificaciones/:materiaID/:alumnoID/:unidadID` | Actualizar calificación por unidad |
| `PATCH` | `/api/controlescolar/materias/:materiaID` | Actualizar materia |
| `PATCH` | `/api/controlescolar/maestros/:maestroID` | Actualizar maestro |
| `PATCH` | `/api/controlescolar/alumnos/:alumnoID` | Actualizar alumno (incluye vincular usuario) |
| `DELETE` | `/api/controlescolar/calificaciones/:materiaID/:alumnoID/:unidadID` | Eliminar calificación por unidad (soft delete) |
| `DELETE` | `/api/controlescolar/materias/:materiaID` | Eliminar materia (soft delete) |
| `DELETE` | `/api/controlescolar/alumnos/:alumnoID` | Eliminar alumno (soft delete) |

### Maestro

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/maestro/materias` | Lista de materias asignadas |
| `GET` | `/api/maestro/alumnos` | Lista de alumnos por materia |
| `POST` | `/api/maestro/calificaciones` | Registrar calificación (por unidad 1-5) |

### Alumno

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/alumno/calificaciones` | Mis calificaciones |
| `GET` | `/api/alumno/calificaciones/:materiaID` | Calificación por materia |
| `GET` | `/api/alumno/promedio` | Mi promedio general |

### Rutas Generales (Autenticadas)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/materias` | Lista de todas las materias |
| `GET` | `/api/usuarios/list` | Lista de usuarios |
| `GET` | `/api/alumnos/list` | Lista de alumnos |

**Nota:** Todas las rutas (excepto `/api/auth/login`) requieren token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🗄️ Modelo de Datos

### Entidades Principales

#### Usuarios
- `id` (PK)
- `nombre` (STRING)
- `email` (STRING, UNIQUE)
- `password_hash` (STRING)
- `rol` (ENUM: 'MAESTRO', 'CONTROL_ESCOLAR', 'ALUMNO')
- `created_at`, `updated_at`

#### Alumnos
- `id` (PK)
- `nombre` (STRING)
- `matricula` (STRING, UNIQUE)
- `grupo` (STRING)
- `semestre` (INTEGER, opcional)
- `fecha_nacimiento` (DATE, opcional)
- `usuario_id` (FK → Usuarios)
- `created_at`, `updated_at`

#### Materias
- `id` (PK)
- `codigo` (STRING, UNIQUE)
- `nombre` (STRING)
- `descripcion` (TEXT, opcional)
- `semestre` (INTEGER, 1-8) - **Semestre al que pertenece la materia**
- `estatus` (INTEGER)
- `created_at`, `updated_at`

#### Asignaciones
- `id` (PK)
- `maestro_id` (FK → Usuarios)
- `materia_id` (FK → Materias)
- `cupo_maximo` (INTEGER, default: 40)
- `created_at`, `updated_at`
- **Índice único:** (maestro_id, materia_id)

#### Calificaciones
- `id` (PK)
- `alumno_id` (FK → Alumnos)
- `materia_id` (FK → Materias)
- `maestro_id` (FK → Usuarios)
- `nota` (DECIMAL, 0-10)
- `unidad` (INTEGER, 1-5) - **Número de unidad de evaluación**
- `observaciones` (TEXT, opcional)
- `deleted_at` (DATE, opcional) - **Soft Delete**
- `created_at`, `updated_at`

### Relaciones

- **Usuario** 1:1 **Alumno** (cuando rol = 'ALUMNO')
- **Asignación** N:1 **Usuario** (maestro)
- **Asignación** N:1 **Materia**
- **Calificación** N:1 **Alumno**
- **Calificación** N:1 **Materia**
- **Calificación** N:1 **Usuario** (maestro)

---

## Credenciales de Prueba

El sistema incluye datos de prueba pre-configurados (50 maestros, 50 materias, 50 alumnos):

### Administrador
- **Email:** `admin@escuela.com`
- **Password:** `password123`
- **Rol:** Control Escolar

### Maestros
- **Email:** `juan.perez@escuela.com`
- **Password:** `password123`
- **Rol:** Maestro

- **Email:** `ana.lopez@escuela.com`
- **Password:** `password123`
- **Rol:** Maestro

### Alumnos
- **Email:** `raul.castro@escuela.com`
- **Password:** `password123`
- **Rol:** Alumno
- **Matrícula:** A1001
- **Grupo:** A

- **Email:** `sofia.garcia@escuela.com`
- **Password:** `password123`
- **Rol:** Alumno
- **Matrícula:** A1002
- **Grupo:** A

- **Email:** `luis.hernandez@escuela.com`
- **Password:** `password123`
- **Rol:** Alumno
- **Matrícula:** B2001
- **Grupo:** B

- **Email:** `carolina.diaz@escuela.com`
- **Password:** `password123`
- **Rol:** Alumno
- **Matrícula:** B2002
- **Grupo:** B

---

## Docker

### Comandos Útiles

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Reiniciar un servicio específico
docker-compose restart backend
```

### Variables de Entorno

El archivo `.env` debe contener:

```env
# Base de Datos
DB_HOST=db
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sistema_escolar

# Backend
PORT=3000
JWT_SECRET=tu_secret_key_super_segura_cambiar_en_produccion
NODE_ENV=development
SEED_FORCE=false

# Frontend
VITE_API_URL=http://localhost:3000/api
FRONTEND_URL=http://localhost:5173
```

**Importante:** Cambiar `JWT_SECRET` y `DB_PASSWORD` en producción.

---

## Desarrollo

### Scripts Disponibles

#### Backend
```bash
npm run dev    # Desarrollo con nodemon (auto-reload)
npm start      # Producción
npm test       # Ejecutar tests
```

#### Frontend
```bash
npm run dev    # Servidor de desarrollo
npm run build  # Build para producción
npm run preview # Preview del build
npm run lint   # Linter
```

### Persistencia de Datos

Por defecto, el sistema **preserva los datos** al reiniciar. Los seeders solo se ejecutan si:
- No existe el usuario `admin@escuela.com`, o
- `SEED_FORCE=true` está configurado

Para forzar la recreación de datos:
```bash
# En .env
SEED_FORCE=true
```

### Base de Datos

El sistema usa **Sequelize Sync** con `alter: true`, lo que significa que:
- Las tablas se crean automáticamente si no existen
- Los cambios en modelos se reflejan en la BD (con cuidado en producción)

**Para producción:** Usar migraciones explícitas en lugar de `sync({ alter: true })`.

---

##  Sistema de Diseño

### Paleta de Colores

El sistema utiliza una paleta profesional basada en:
- **Primary (Azul):** `#0ea5e9` - Acciones principales, headers
- **Secondary (Púrpura):** `#a855f7` - Panel de maestros, elementos secundarios
- **Accent (Verde):** `#22c55e` - Éxito, acciones positivas
- **Neutral (Gris):** Escala completa para textos y fondos

### Animaciones

- **fade-in:** Aparición suave
- **fade-in-up:** Aparición desde abajo
- **fade-in-down:** Aparición desde arriba
- **slide-in-right/left:** Deslizamiento lateral
- **scale-in:** Escalado suave
- **bounce-subtle:** Bounce sutil para iconos

---

## Notas Importantes

1. **Seguridad:**
   - Las contraseñas se hashean con bcrypt
   - Los tokens JWT expiran (configurar en producción)
   - Helmet protege contra vulnerabilidades comunes

2. **Soft Delete:**
   - Las calificaciones y alumnos usan soft delete (`deleted_at`)
   - No se eliminan físicamente de la base de datos
   - Permite recuperación de datos eliminados

3. **Validaciones:**
   - Escala de calificaciones: 0.00 a 10.00
   - Unidades por materia: 1 a 5
   - Semestres: 1 a 8
   - Emails normalizados (lowercase, trim)
   - Validación robusta con express-validator

4. **Performance:**
   - Índices en campos críticos (email, matricula)
   - Queries optimizadas con Sequelize includes
   - Paginación recomendada para grandes volúmenes

5. **Interfaz de Usuario:**
   - Selectores de materias agrupados visualmente por semestre para mejor navegación
   - Dropdowns personalizados con mejor UX que los selectores HTML nativos
   - Filtrado en tiempo real sin recargar la página
   - Visualización clara de relaciones entre materias y semestres

---

## Contribución

Este proyecto es parte de una prueba técnica. Para contribuciones:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

##  Licencia

Este proyecto es de uso educativo y demostrativo.

---

## Soporte

Para problemas o preguntas, consulta la documentación de los endpoints en `/api` o revisa los logs del servidor.

---

**Desarrollado con ❤️ usando React, Node.js y PostgreSQL**
