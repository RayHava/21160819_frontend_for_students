import { createResourceApi } from '@/api/client'

const rolesApi = createResourceApi('roles')
const usersApi = createResourceApi('usuarios')
const employeesApi = createResourceApi('employees')

const statusColumn = {
  key: 'is_active',
  label: 'Estado',
  value: (row) => (row.is_active ? 'Activo' : 'Inactivo'),
}
const statusField = { key: 'is_active', label: 'Activo', type: 'checkbox', editOnly: true }

/*
 * Qué muestra cada sección.
 * - lookups: listas extra que se cargan para mostrar nombres y llenar selectores.
 * - required: true (siempre) o 'create' (solo al crear).
 * - whenEmpty: 'omit' no envía el campo vacío; por defecto se envía null.
 */
export const RESOURCES = {
  roles: {
    label: 'Roles',
    singular: 'rol',
    plural: 'roles',
    api: rolesApi,
    lookups: {},
    displayName: (row) => row.name,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Nombre', strong: true },
      { key: 'description', label: 'Descripción', wrap: true, empty: 'Sin descripción' },
    ],
    fields: [
      { key: 'name', label: 'Nombre', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },

  usuarios: {
    label: 'Usuarios',
    singular: 'usuario',
    plural: 'usuarios',
    api: usersApi,
    lookups: { roles: rolesApi.list },
    displayName: (row) => row.username,
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'username', label: 'Usuario', strong: true },
      { key: 'email', label: 'Correo', wrap: true },
      {
        key: 'role_id',
        label: 'Rol',
        value: (row, { roles }) => roles.find((role) => role.id === row.role_id)?.name,
      },
      statusColumn,
    ],
    fields: [
      { key: 'username', label: 'Usuario', required: true },
      { key: 'email', label: 'Correo', type: 'email', required: true },
      {
        key: 'password',
        label: 'Contraseña',
        type: 'password',
        required: 'create',
        whenEmpty: 'omit',
        editHint: 'Déjala vacía para conservar la actual.',
      },
      {
        key: 'role_id',
        label: 'Rol',
        type: 'select',
        required: true,
        options: ({ roles }) => roles.map((role) => ({ value: role.id, label: role.name })),
      },
      statusField,
    ],
  },

  empleados: {
    label: 'Empleados',
    singular: 'empleado',
    plural: 'empleados',
    api: employeesApi,
    lookups: { users: usersApi.list },
    displayName: (row) => `${row.first_name} ${row.last_name}`,
    columns: [
      { key: 'id', label: 'ID' },
      {
        key: 'name',
        label: 'Nombre',
        strong: true,
        value: (row) => `${row.first_name} ${row.last_name}`,
      },
      {
        key: 'user_id',
        label: 'Usuario',
        value: (row, { users }) => users.find((user) => user.id === row.user_id)?.username,
      },
      { key: 'job_title', label: 'Puesto', wrap: true, empty: 'Sin puesto' },
      { key: 'phone', label: 'Teléfono', nowrap: true, empty: 'Sin teléfono' },
      { key: 'address', label: 'Dirección', wrap: true, empty: 'Sin dirección' },
      { key: 'hired_at', label: 'Ingreso', nowrap: true },
      statusColumn,
    ],
    fields: [
      {
        key: 'user_id',
        label: 'Usuario',
        type: 'select',
        required: true,
        options: ({ users }) => users.map((user) => ({ value: user.id, label: user.username })),
        emptyHint: 'Primero crea un usuario en la sección Usuarios.',
      },
      { key: 'first_name', label: 'Nombre', required: true },
      { key: 'last_name', label: 'Apellido', required: true },
      { key: 'job_title', label: 'Puesto' },
      { key: 'phone', label: 'Teléfono', type: 'tel' },
      { key: 'address', label: 'Dirección', type: 'textarea' },
      { key: 'hired_at', label: 'Fecha de ingreso', type: 'date', whenEmpty: 'omit' },
      statusField,
    ],
  },
}
