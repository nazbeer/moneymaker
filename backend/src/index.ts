import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import moodRoutes from "./routes/mood";
import chatRoutes from "./routes/chat";
import dashboardRoutes from "./routes/dashboard";
import journalRoutes from "./routes/journal";
import communityRoutes from "./routes/community";
import exercisesRoutes from "./routes/exercises";
import affirmationsRoutes from "./routes/affirmations";
import apikeysRoutes from "./routes/apikeys";
import stripeRoutes from "./routes/stripe";
import sdkRoutes from "./routes/sdk";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS - allow frontend origins
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:8081", // Expo dev
    ],
    credentials: true,
  })
);

// Parse JSON for all routes except Stripe webhook (needs raw body)
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/exercises", exercisesRoutes);
app.use("/api/affirmations", affirmationsRoutes);
app.use("/api/apikeys", apikeysRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/sdk", sdkRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`HealMind API server running on http://localhost:${PORT}`);
});
