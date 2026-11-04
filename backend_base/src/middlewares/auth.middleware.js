const { verifyToken, findActiveUser } = require("../auth/auth.service");

function unauthorized(res, message) {
  res.set("WWW-Authenticate", "Bearer");
  return res.status(401).json({ status: "error", message });
}

// Exige un token válido: Authorization: Bearer <token>
async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return unauthorized(res, "Debes iniciar sesión para acceder a este recurso");
  }

  const userId = verifyToken(token);
  const user = userId && (await findActiveUser(userId));
  if (!user) {
    return unauthorized(res, "La sesión no es válida o ha expirado");
  }

  req.user = user;
  return next();
}

// Exige que el usuario autenticado tenga uno de los roles indicados.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "No tienes permiso para realizar esta acción",
      });
    }
    return next();
  };
}

// TEMPORAL: el frontend aún no tiene login, así que en desarrollo roles, usuarios v2 y
// empleados no piden token. Si NODE_ENV falta o tiene otro valor, quedan protegidas.
const openInDev = process.env.NODE_ENV === "development";
if (openInDev) {
  console.warn("AVISO: roles, usuarios v2 y empleados están abiertas sin token (desarrollo)");
}

const skipCheck = (req, res, next) => next();
const protect = openInDev ? skipCheck : requireAuth;
const allowRoles = (...roles) => (openInDev ? skipCheck : requireRole(...roles));

module.exports = { requireAuth, requireRole, protect, allowRoles };
