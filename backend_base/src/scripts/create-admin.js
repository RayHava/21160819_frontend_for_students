// Crea el primer administrador o restablece uno existente con ese username.
// Uso: ver la sección "Seguridad" del README.
const bcrypt = require("bcrypt");
const db = require("../database/postgres.database");

async function main() {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Define ADMIN_USERNAME, ADMIN_EMAIL y ADMIN_PASSWORD");
  }
  if (
    ADMIN_PASSWORD.length < 8 ||
    Buffer.byteLength(ADMIN_PASSWORD, "utf8") > 72
  ) {
    throw new Error("La contraseña debe tener entre 8 caracteres y 72 bytes");
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash, role_id)
     SELECT $1, $2, $3, id FROM roles WHERE name = 'admin'
     ON CONFLICT (username) DO UPDATE
     SET email = EXCLUDED.email,
         password_hash = EXCLUDED.password_hash,
         role_id = EXCLUDED.role_id,
         is_active = TRUE,
         failed_attempts = 0,
         locked_until = NULL
     RETURNING username`,
    [ADMIN_USERNAME.trim(), ADMIN_EMAIL.trim(), passwordHash]
  );
  if (!rows[0]) throw new Error("No existe el rol admin en la base de datos");

  console.log(`Administrador listo: ${rows[0].username}`);
}

main()
  .catch((error) => {
    console.error("No se pudo crear el administrador:", error.message);
    process.exitCode = 1;
  })
  .finally(() => db.cerrarConexion());
