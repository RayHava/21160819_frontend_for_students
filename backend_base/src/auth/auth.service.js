const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const db = require("../database/postgres.database");

const JWT_ALGORITHM = "HS256";
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// El servidor no arranca sin un secreto seguro: sin él cualquiera podría firmar tokens.
if (!env.jwtSecret || env.jwtSecret.length < 32) {
  throw new Error("JWT_SECRET debe estar en el .env y tener al menos 32 caracteres");
}

// Se compara contra este hash cuando el usuario no existe, para que la respuesta
// tarde lo mismo y no revele qué usuarios están registrados.
const DUMMY_HASH = bcrypt.hashSync("usuario-inexistente", 12);

function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, {
    subject: String(userId),
    algorithm: JWT_ALGORITHM,
    expiresIn: env.jwtExpiresIn,
  });
}

// Devuelve el id del usuario del token, o null si el token no es válido o expiró.
function verifyToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: [JWT_ALGORITHM] }).sub ?? null;
  } catch {
    return null;
  }
}

async function registerFailedAttempt(userId) {
  await db.query(
    `UPDATE users
     SET locked_until = CASE WHEN failed_attempts + 1 >= $2
           THEN now() + make_interval(mins => $3) ELSE locked_until END,
         failed_attempts = CASE WHEN failed_attempts + 1 >= $2
           THEN 0 ELSE failed_attempts + 1 END
     WHERE id = $1`,
    [userId, MAX_FAILED_ATTEMPTS, LOCK_MINUTES]
  );
}

// Devuelve { token, user } o null. No distingue el motivo del fallo a propósito.
async function login(username, password) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.is_active,
            COALESCE(u.locked_until > now(), false) AS locked, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1`,
    [username]
  );
  const user = rows[0];

  const passwordMatches = await bcrypt.compare(
    password,
    user ? user.password_hash : DUMMY_HASH
  );
  if (!user || !user.is_active || user.locked) return null;

  if (!passwordMatches) {
    await registerFailedAttempt(user.id);
    return null;
  }

  await db.query(
    `UPDATE users
     SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
     WHERE id = $1`,
    [user.id]
  );

  return {
    token: signToken(user.id),
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  };
}

// Se consulta en cada petición para que desactivar un usuario o cambiar su rol
// tenga efecto de inmediato, sin esperar a que expire su token.
async function findActiveUser(userId) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND u.is_active`,
    [userId]
  );
  return rows[0] ?? null;
}

module.exports = { login, verifyToken, findActiveUser };
