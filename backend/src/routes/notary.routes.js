const express = require("express");

const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const notaryController = require("../controllers/notary.controller");

const router = express.Router();

router.get("/pending", authRequired, requireRole("notary"), notaryController.pending);

router.post("/approve/:id", authRequired, requireRole("notary"), notaryController.approve);
router.post("/reject/:id", authRequired, requireRole("notary"), notaryController.reject);
router.post("/execute/:id", authRequired, requireRole("notary"), notaryController.execute);

router.get("/all", authRequired, requireRole("notary"), notaryController.all);

module.exports = router;

