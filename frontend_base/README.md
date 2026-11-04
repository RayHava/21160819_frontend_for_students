# frontend_base

Interfaz en Vue 3 + Vite para administrar roles, usuarios y empleados de `backend_base`.

## Funciones

- **Barra de búsqueda:** vacía muestra todos los registros; admite ID o cualquier dato de
  la tabla, y varios términos separados por comas (`admin, 3`).
- **Crear, editar y eliminar** desde cada sección.

Las columnas y los campos de cada sección se definen en `src/resources.js`.

El backend debe correr con `NODE_ENV=development`: el frontend aún no tiene login y, con
cualquier otro valor, el backend responde 401.

## Puesta en marcha

Con el backend en ejecución en `http://localhost:3000`:

```sh
npm install
npm run dev
```

Abre la dirección que indique Vite (normalmente `http://localhost:5173`). En desarrollo,
las peticiones a `/api` se reenvían al backend; el destino se configura en `vite.config.js`.

## Producción

```sh
npm run build
```

Si el backend se publica en otro dominio, define `VITE_API_URL` antes de compilar:

```sh
VITE_API_URL=https://mi-backend.example.com/api/v2 npm run build
```
