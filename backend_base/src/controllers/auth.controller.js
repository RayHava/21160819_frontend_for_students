const authService = require("../auth/auth.service");
const env = require("../config/env");

const MAX_USERNAME_LENGTH = 30;
const MAX_PASSWORD_BYTES = 72;

function isValidCredential(value) {
  return typeof value === "string" && value.trim() !== "";
}

async function login(req, res) {
  const { username, password } = req.body ?? {};
  if (!isValidCredential(username) || !isValidCredential(password)) {
    return res.status(400).json({
      status: "error",
      message: "username y password son obligatorios",
    });
  }

  const tooLong =
    username.trim().length > MAX_USERNAME_LENGTH ||
    Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES;
  const result = tooLong ? null : await authService.login(username.trim(), password);

  if (!result) {
    return res.status(401).json({
      status: "error",
      message: "Credenciales inválidas o cuenta bloqueada temporalmente",
    });
  }

  return res.json({
    status: "success",
    message: "Sesión iniciada",
    token: result.token,
    expires_in: env.jwtExpiresIn,
    user: result.user,
  });
}

function getCurrentUser(req, res) {
  return res.json({ data: req.user });
}

module.exports = { login, getCurrentUser };
