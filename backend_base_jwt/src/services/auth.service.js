const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/postgres.database");
const env = require("../config/env");

const TOKEN_LIFETIME = "15m";
const FAILED_ATTEMPT_LIMIT = 5;

function getJwtSecret() {
  if (!env.jwtSecret || Buffer.byteLength(env.jwtSecret, "utf8") < 32) {
    throw new Error("JWT_SECRET debe configurarse con al menos 32 bytes");
  }
  return env.jwtSecret;
}

async function authenticateUser(identifier, password) {
  const jwtSecret = getJwtSecret();
  const client = await db.connect();
  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

    const { rows } = await client.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.is_active,
              u.locked_until, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.username = $1 OR u.email = $1
       ORDER BY CASE WHEN u.username = $1 THEN 0 ELSE 1 END
       LIMIT 1
       FOR UPDATE OF u`,
      [identifier]
    );

    const user = rows[0];
    if (!user) {
      await client.query("ROLLBACK");
      transactionStarted = false;
      await bcrypt.hash(password, 12);
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    const isLocked =
      user.locked_until && new Date(user.locked_until).getTime() > Date.now();
    if (!user.is_active || isLocked || !passwordMatches) {
      if (user.is_active && !isLocked && !passwordMatches) {
        await client.query(
          `UPDATE users
           SET failed_attempts = LEAST(failed_attempts + 1, $2),
               locked_until = CASE
                 WHEN failed_attempts + 1 >= $2
                   THEN now() + interval '15 minutes'
                 ELSE locked_until
               END
           WHERE id = $1`,
          [user.id, FAILED_ATTEMPT_LIMIT]
        );
        await client.query("COMMIT");
        transactionStarted = false;
      } else {
        await client.query("ROLLBACK");
        transactionStarted = false;
      }
      return null;
    }

    await client.query(
      `UPDATE users
       SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
       WHERE id = $1`,
      [user.id]
    );
    await client.query("COMMIT");
    transactionStarted = false;

    const publicUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const accessToken = jwt.sign(
      {},
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: TOKEN_LIFETIME,
        issuer: env.serviceName,
        subject: String(user.id),
      }
    );

    return { accessToken, expiresIn: TOKEN_LIFETIME, user: publicUser };
  } catch (error) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getActiveUserById(id) {
  const { rows } = await db.query(
    `SELECT u.id, u.username, u.email, r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 AND u.is_active = TRUE`,
    [id]
  );
  return rows[0] || null;
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    issuer: env.serviceName,
  });
}

module.exports = {
  authenticateUser,
  getActiveUserById,
  verifyAccessToken,
};
