# backend_for_students
Este repositorio es creado con la base minima de un microservicio con NodeJS y Express 

TENDREMOS LA SIGUIENTE DISTRIBUCIÓN DE CARPETAS DENTRO DEL PROYECTO,
RECORDAR LO VISTO EN CLASE EN DONDE CADA CARPETA NOS AYUDA A TENER UN ORDEN EN NUESTROS ARCHIVOS.

├── src/
│   ├── config/  **configuraciones del servidor
│   │   └── env.js
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   │   └── health.routes.js  **rutas definidas
│   ├── services/
│   ├── app.js
│   └── server.js
├── tests/
├── .env
├── .env.example
├── .gitignore
└── package.json

Utilizaremos los siguientes dependencias
-> Express
-> cors
-> helmet
-> dotenv

y dependencias de desarrollo como lo son
-> nodemon

## Conexión a PostgreSQL

La conexión se configura mediante `URL_DB` en el archivo `.env`. Copia `.env.example`
a `.env` y reemplaza el usuario, contraseña, host, puerto y nombre de la base de datos
por los de tu instalación de PostgreSQL. No compartas ni subas el archivo `.env`.

Para Render, usa la **External Database URL** que aparece en el menú **Connect** de la
base de datos; la URL interna solo funciona desde servicios Render en la misma región.
La conexión usa TLS por defecto (`DB_SSL=true`). Para una base local que no tenga SSL,
configura `DB_SSL=false`.

La aplicación prueba la conexión al iniciar y la cierra al recibir `SIGINT` o
`SIGTERM`. El módulo `src/database/postgres.database.js` exporta `client` para ejecutar
consultas; usa parámetros (`$1`, `$2`, ...) en lugar de concatenar valores en SQL.

## Seguridad

Las rutas exigen un token JWT en la cabecera `Authorization: Bearer <token>`, que se
obtiene con `POST /api/v2/auth/login`. El servidor no arranca sin `JWT_SECRET` en `.env`.

| Ruta | Consultar | Crear y editar | Eliminar |
|---|---|---|---|
| `/api/v1/health`, `POST /api/v2/auth/login` | Pública | Pública | - |
| `GET /api/v2/auth/me` | Autenticado | - | - |
| `/api/v2/roles` | Autenticado | admin | admin |
| `/api/v2/employees` | admin, manager | admin, manager | admin |
| `/api/v2/usuarios`, `/api/v1/usuarios` | admin | admin | admin |

**Temporal:** mientras el frontend no tenga login, roles, `/api/v2/usuarios` y empleados no piden token cuando
`NODE_ENV=development`. Con cualquier otro valor, o sin definirla, aplica la tabla anterior.

Tras 5 intentos fallidos de inicio de sesión, la cuenta se bloquea 15 minutos. Los roles
`admin` y `manager` no se pueden renombrar ni eliminar porque las rutas dependen de ellos.

### Crear el primer administrador

También sirve para recuperar el acceso a una cuenta. El primer comando pide la contraseña
sin mostrarla ni guardarla en el historial:

```sh
read -rs ADMIN_PASSWORD && export ADMIN_PASSWORD
ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com npm run create-admin
unset ADMIN_PASSWORD
```
