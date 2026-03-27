const express = require("express");

const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const heirController = require("../controllers/heir.controller");

const router = express.Router();

router.get("/testaments", authRequired, requireRole("heir"), heirController.getHeirTestaments);

module.exports = router;

