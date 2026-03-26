const express = require("express");

const authController = require("../controllers/auth.controller");
const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");

const router = express.Router();

router.post("/register", authController.register);
router.post("/nonce", authController.nonce);
router.post("/verify", authController.verify);

module.exports = router;

