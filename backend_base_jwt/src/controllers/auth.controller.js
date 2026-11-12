const { authenticateUser } = require("../services/auth.service");

const LOGIN_FAILURE = {
  error: "UNAUTHORIZED",
  message: "Credenciales incorrectas o cuenta no disponible",
};

async function login(req, res) {
  const { identifier, password } = req.body || {};
  if (
    typeof identifier !== "string" ||
    identifier.trim() === "" ||
    identifier.trim().length > 254 ||
    typeof password !== "string" ||
    password.length === 0 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      error: "INVALID_CREDENTIALS",
      message: "identifier y password son obligatorios y deben ser válidos",
    });
  }

  try {
    const result = await authenticateUser(identifier.trim(), password);
    if (!result) {
      return res.status(401).json(LOGIN_FAILURE);
    }
    return res.json({
      accessToken: result.accessToken,
      tokenType: "Bearer",
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (error) {
    console.error("Error al autenticar usuario:", error);
    return res.status(500).json({
      error: "AUTHENTICATION_ERROR",
      message: "No fue posible completar la autenticación",
    });
  }
}

function getCurrentUser(req, res) {
  return res.json({ data: req.user });
}

module.exports = { login, getCurrentUser };
