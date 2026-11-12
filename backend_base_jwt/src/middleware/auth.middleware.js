const {
  getActiveUserById,
  verifyAccessToken,
} = require("../services/auth.service");

function unauthorized(res) {
  return res.status(401).json({
    error: "UNAUTHORIZED",
    message: "Se requiere un token de acceso válido",
  });
}

async function authenticate(req, res, next) {
  const authorization = req.get("authorization");
  const match =
    typeof authorization === "string" &&
    authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) {
    return unauthorized(res);
  }

  let payload;
  try {
    payload = verifyAccessToken(match[1]);
  } catch (error) {
    if (error.message.startsWith("JWT_SECRET")) {
      console.error("Configuración de autenticación inválida:", error.message);
      return res.status(500).json({
        error: "AUTH_CONFIGURATION_ERROR",
        message: "El servicio de autenticación no está configurado",
      });
    }
    return unauthorized(res);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !/^[1-9]\d*$/.test(payload.sub)
  ) {
    return unauthorized(res);
  }

  try {
    const user = await getActiveUserById(payload.sub);
    if (!user) {
      return unauthorized(res);
    }
    req.user = user;
    return next();
  } catch (error) {
    console.error("Error al validar el usuario autenticado:", error);
    return res.status(500).json({
      error: "AUTHENTICATION_ERROR",
      message: "No fue posible validar la sesión",
    });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "No tienes permisos para realizar esta acción",
      });
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
