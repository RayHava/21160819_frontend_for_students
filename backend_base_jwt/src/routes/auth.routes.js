const express = require("express");
const {
  login,
  getCurrentUser,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - identifier
 *         - password
 *       properties:
 *         identifier:
 *           type: string
 *           description: Nombre de usuario o correo electrónico.
 *           example: ana28
 *         password:
 *           type: string
 *           format: password
 *           example: "ClaveSegura123"
 *     AuthUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [admin, manager, cashier]
 *     LoginResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         tokenType:
 *           type: string
 *           example: Bearer
 *         expiresIn:
 *           type: string
 *           example: 15m
 *         user:
 *           $ref: '#/components/schemas/AuthUser'
 *     AuthError:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     operationId: login
 *     summary: Iniciar sesión
 *     description: Autentica con nombre de usuario o correo y devuelve un JWT válido durante 15 minutos. Tras cinco intentos fallidos, la cuenta se bloquea temporalmente.
 *     tags:
 *       - Autenticación
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Inicio de sesión correcto.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Las credenciales están incompletas o no son válidas.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       401:
 *         description: Credenciales incorrectas, cuenta inactiva o bloqueada.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 *       500:
 *         description: Error interno al autenticar.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthError'
 */
router.post("/login", login);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     operationId: getCurrentUser
 *     summary: Obtener el usuario autenticado
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario asociado al token vigente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/AuthUser'
 *       401:
 *         description: Token ausente, inválido o expirado.
 *       500:
 *         description: Error interno al validar el token.
 */
router.get("/me", authenticate, getCurrentUser);

module.exports = router;