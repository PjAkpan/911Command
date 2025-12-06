
/**
 * @swagger
 * /911command/v3/health/check:
 *   get:
 *     summary: check
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
        

/**
 * @swagger
 * /911command/v3/health/encrypt:
 *   post:
 *     summary: encrytData
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
        

/**
 * @swagger
 * /911command/v3/health/decrypt:
 *   post:
 *     summary: decryptData
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
        

/**
 * @swagger
 * /911command/v3/auth/check:
 *   get:
 *     summary: check
 *     tags: [auth]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
        

/**
 * @swagger
 * /911command/v3/auth/signup:
 *   post:
 *     summary: createAuth
 *     tags: [auth]
 *     
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             {
 *               "type": "object",
 *               "properties": {
 *                 "fullName": {
 *                   "type": "string",
 *                   "minLength": 2,
 *                   "maxLength": 50,
 *                   "example": "John Doe"
 *                 },
 *                 "email": {
 *                   "type": "string",
 *                   "format": "email",
 *                   "example": "john.doe@example.com"
 *                 },
 *                 "phone": {
 *                   "type": "string",
 *                   "example": "08012345678"
 *                 },
 *                 "address": {
 *                   "type": "string",
 *                   "example": "12 Palm Avenue, Lagos"
 *                 },
 *                 "consents": {
 *                   "type": "boolean",
 *                   "example": true
 *                 },
 *                 "password": {
 *                   "type": "string",
 *                   "pattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};':\"\\\\|,.<>/?]).{8,20}$",
 *                   "example": "Password@123"
 *                 }
 *               },
 *               "required": [
 *                 "fullName",
 *                 "email",
 *                 "phone",
 *                 "address",
 *                 "consents",
 *                 "password"
 *               ],
 *               "additionalProperties": false
 *             }
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
        