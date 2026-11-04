const express = require("express");
const { login, getCurrentUser } = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     operationId: login
 *     summary: Iniciar sesión
 *     description: >
 *       Devuelve un token JWT. Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Sesión iniciada; usa el token en el botón Authorize.
 *       400:
 *         description: Faltan datos.
 *       401:
 *         description: Credenciales inválidas o cuenta bloqueada.
 */
router.post("/login", login);

/**
 * @swagger
 * /api/v2/auth/me:
 *   get:
 *     operationId: getCurrentUser
 *     summary: Obtener el usuario de la sesión actual
 *     tags:
 *       - Autenticación
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado.
 *       401:
 *         description: Sesión no válida o expirada.
 */
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
