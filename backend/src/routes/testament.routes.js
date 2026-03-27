const express = require("express");
const multer = require("multer");

const { authRequired } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const testamentController = require("../controllers/testament.controller");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/upload",
  authRequired,
  requireRole("testator", "admin"),
  upload.single("file"),
  testamentController.uploadTestament
);

router.post(
  "/submit/:id",
  authRequired,
  requireRole("testator", "admin"),
  testamentController.submitTestament
);

router.post(
  "/blockchain/:id",
  authRequired,
  requireRole("testator", "admin"),
  testamentController.setBlockchainId
);

router.post(
  "/heirs/:id",
  authRequired,
  requireRole("testator"),
  testamentController.updateHeirs
);

router.get(
  "/my",
  authRequired,
  requireRole("testator", "admin"),
  testamentController.getMyTestaments
);

router.get("/:id", authRequired, testamentController.getTestamentById);

module.exports = router;

