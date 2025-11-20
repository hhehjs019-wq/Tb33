const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const config = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(config.MONGO_URI);
let db;

// -------------------- CONNECT TO MONGO --------------------
async function connectDB() {
  await client.connect();
  db = client.db("youtube_tracker");
  console.log("MongoDB connected");
}
connectDB();

// -------------------- FETCH YOUTUBE STATS --------------------
async function fetchStats(videoId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${config.YT_API_KEY}`;
    const res = await axios.get(url);
    const stats = res.data.items[0].statistics;

    return {
      views: Number(stats.viewCount),
      likes: Number(stats.likeCount || 0),
      timestamp: new Date()
    };
  } catch (err) {
    console.error("API Error:", err.message);
    return null;
  }
}

// -------------------- CRON JOB (EVERY 5 MINUTES) --------------------
const cron = require("node-cron");

cron.schedule("*/5 * * * *", async () => {
  console.log("Running 5-minute cron job...");

  const videos = await db.collection("videos").find().toArray();

  for (const v of videos) {
    const stats = await fetchStats(v.videoId);

    if (stats) {
      await db.collection("history").insertOne({
        videoId: v.videoId,
        ...stats
      });

      console.log("Stored stats for:", v.videoId);
    }
  }
});

// -------------------- START TRACKING ROUTE --------------------
app.post("/start", async (req, res) => {
  const { videoId } = req.body;

  await db.collection("videos").updateOne(
    { videoId },
    { $set: { videoId } },
    { upsert: true }
  );

  res.json({ message: "Tracking started", videoId });
});

// -------------------- HISTORY ROUTE (IMPORTANT) --------------------
app.get("/history/:videoId", async (req, res) => {
  const videoId = req.params.videoId;

  const data = await db.collection("history")
    .find({ videoId })
    .sort({ timestamp: 1 })
    .toArray();

  res.json(data);
});

// -------------------- DEFAULT ROUTE --------------------
app.get("/", (req, res) => {
  res.send("YouTube Tracker Backend Running");
});

// -------------------- START SERVER --------------------
app.listen(10000, () => console.log("Server running on port 10000"));
