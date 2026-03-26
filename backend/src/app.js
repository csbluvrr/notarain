require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const testamentRoutes = require("./routes/testament.routes");
const notaryRoutes = require("./routes/notary.routes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/testament", testamentRoutes);
app.use("/api/notary", notaryRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  return res.status(500).json({ error: err.message || "Server error" });
});

async function start() {
  await connectDB();

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

