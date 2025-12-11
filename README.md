# Sistema de Gestión de Calificaciones Escolares

## Instrucción Principañ

---

## 1. Arquitectura y Tecnología

**Arquitectura:** Monorepo con Back-end y Front-end separados.

**Back-end:** Node.js (Express), PostgreSQL (DB), Sequelize (ORM), arquitectura **MVC**.

**Front-end:** React con TypeScript (`.tsx`), Vite, Axios con interceptores JWT.

**DevOps:** Docker Compose para levantar DB, API y Cliente con un solo comando.

**Seguridad:** Todas las rutas excepto `/login` protegidas con **JWT**.

---

## 2. Roles y Escala de Calificaciones

**Roles:** `MAESTRO` y `CONTROL_ESCOLAR`.

**Escala de Notas:** 0.00 a 10.00, validada estrictamente en la API.

---

## 3. Modelo de Datos (Sequelize)

| Entidad | Campos Clave | Relaciones | Notas Especiales |
| :--- | :--- | :--- | :--- |
| **Usuarios** | `id`, `email`, `password_hash`, `rol` | Calificaciones y Asignaciones (`maestro_id`) | Seeders con 1 Admin y 2 Maestros |
| **Alumnos** | `id`, `nombre`, `matricula` | Calificaciones | |
| **Materias** | `id`, `nombre`, `codigo` | Calificaciones y Asignaciones | |
| **Asignaciones** | `id`, `maestro_id`, `materia_id`, `cupo_maximo` | FK a Usuarios y Materias | Define qué maestro imparte qué materia |
| **Calificaciones** | `id`, `alumno_id`, `materia_id`, `maestro_id`, `nota` | FK a Alumnos, Materias y Usuarios | Implementa **Soft Delete** (`deleted_at`) |

---

## 4. Definición de Endpoints (API REST)

| Método | Endpoint | Rol | Función |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Público | Autenticación de credenciales |
| `GET` | `/maestro/alumnos` | `MAESTRO` | Lista alumnos asignados con calificaciones |
| `POST` | `/maestro/calificaciones/{materiaID}/{alumnoID}` | `MAESTRO` | Registra o actualiza calificación |
| `POST` | `/controlescolar/asignacion` | `CONTROL_ESCOLAR` | Asigna materia a maestro |
| `GET` | `/controlescolar/reporte` | `CONTROL_ESCOLAR` | Reporte global de promedios por alumno |
| `PATCH`| `/controlescolar/calificaciones/{materiaID}/{alumnoID}` | `CONTROL_ESCOLAR` | Actualiza nota u observaciones |
| `DELETE`| `/controlescolar/calificaciones/{materiaID}/{alumnoID}` | `CONTROL_ESCOLAR` | Soft Delete de calificación |

---

## 5. Estrategia de Inicialización de la DB

```javascript
import express from 'express';
import { sequelize } from './models';
import seeders from './seeders';

const app = express();
app.use(express.json());

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seeders();
    app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));
  } catch (error) {
    console.error('Error al iniciar la DB:', error);
  }
})();
```

> Garantiza que la API solo reciba peticiones cuando la DB esté lista.

---

## 6. Lógica del Reporte Global (SQL/Sequelize)

```javascript
const report = await Calificacion.findAll({
  attributes: [
    'alumno_id',
    [sequelize.fn('AVG', sequelize.col('nota')), 'promedio']
  ],
  where: { deleted_at: null },
  group: ['alumno_id'],
  include: [{ model: Alumno, attributes: ['nombre', 'matricula'] }]
});
```

> Calcula promedio de todos los alumnos ignorando registros eliminados.

---

## 7. Implementación del Soft Delete

```javascript
const Calificacion = sequelize.define('Calificacion', {
  nota: { type: DataTypes.FLOAT, allowNull: false, validate: { min: 0, max: 10 } },
  deleted_at: { type: DataTypes.DATE, allowNull: true }
}, { paranoid: true });

// DELETE endpoint
app.delete('/api/controlescolar/calificaciones/:materiaID/:alumnoID', async (req, res) => {
  await Calificacion.destroy({ where: { materia_id: req.params.materiaID, alumno_id: req.params.alumnoID } });
  res.json({ message: 'Calificación eliminada (Soft Delete)' });
});
```

> `paranoid: true` asegura que `.destroy()` solo marque `deleted_at`.

---

## 8. Flujo de la Interfaz del Admin (Front-end)

1. **Selector de Materia**: Muestra todas las materias.
2. **Tabla de Alumnos**: Nombre, Maestro asignado, Nota, Edit/Delete.
3. **Editar Calificación**: Modal con input de nota y observaciones, PATCH con JWT.
4. **Eliminar Calificación**: Confirma y DELETE (Soft Delete) con JWT.
5. **Reporte Global**: GET /controlescolar/reporte, visualiza promedio por alumno.

```typescript
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## 9. Instrucciones para Levantar el Proyecto

1. Clona el repositorio y entra a la carpeta raíz.

```bash
git clone <repo_url>
cd proyecto-calificaciones
```

2. Crea el archivo `.env` con tus credenciales y JWT secreto.

3. Asegúrate de tener **Docker** y **Docker Compose** instalados.

4. Levanta todo el entorno con un solo comando:

```bash
docker-compose up --build
```

5. Accede a los servicios:

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend:** [http://localhost:3000/api](http://localhost:3000/api)

6. Para detener el proyecto:

```bash
docker-compose down
```

7. Para reiniciar con cambios:

```bash
docker-compose up --build
```

> Nota: Los seeders insertarán automáticamente un Admin y dos Maestros.

---

## 10. Notas Finales
- Validar todas las notas entre 0 y 10.
- JWT obligatorio en todas las rutas protegidas.
- Docker Compose permite levantar todo el entorno en un comando.
- Seeders deben crear al menos un Admin y dos Maestros.

---

# Omar Bermejo Osuna - 11/12/2025
