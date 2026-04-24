require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const testamentRoutes = require("./routes/testament.routes");
const notaryRoutes = require("./routes/notary.routes");
const heirRoutes = require("./routes/heir.routes");
const NotaryMonitor = require("./jobs/notaryMonitor");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/testament", testamentRoutes);
app.use("/api/notary", notaryRoutes);
app.use("/api/heir", heirRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _, res, __) => {
  console.error(err);
  return res.status(500).json({ error: err.message || "Server error" });
});

async function start() {
  const notaryMonitor = new NotaryMonitor();
  notaryMonitor.start();

  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exitCode = 1;
});

module.exports = app;
