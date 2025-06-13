require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const path = require("path");
const fs = require("fs").promises;
const FormData = require("form-data");
const fetch = require("node-fetch");

// Initialize express app
const app = express();
// // CORS configuration
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS to all routes
app.use(cors(corsOptions));

app.use(express.json());

// Initialize OpenAI
let openai;
if (process.env.NODE_ENV !== "test") {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Whitelist of allowed topics
const allowedTopics = ["Supermarkt", "Schule", "Küche", "Park", "Bäckerei"];

// Routes
app.post("/api/generate-image", async (req, res) => {
  try {
    const { topicId } = req.body;
    if (
      typeof topicId !== "number" ||
      !Number.isInteger(topicId) ||
      topicId < 0 ||
      topicId >= allowedTopics.length
    ) {
      return res.status(400).json({ error: "Missing or invalid topicId" });
    }
    const topic = allowedTopics[topicId];

    // Use a fake response in test environment to avoid consuming API credits
    if (process.env.NODE_ENV === "test") {
      return res.status(200).json({
        image: "iVBORw0KGgoAAAANSUhEUgAAAAUA" + "A".repeat(120),
        topic,
        elements: ["Einkaufswagen", "Kasse", "Gemüseabteilung"],
      });
    }

    // Read the prompt template
    const promptTemplate = await fs.readFile(
      path.join(__dirname, "prompts", "createImageDescription.txt"),
      "utf-8"
    );
    const prompt = promptTemplate.replace("$TOPIC", topic);

    // Generate the
    const completion = await openai.chat.completions.create({
      model: process.env.TEXT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates German learning materials.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const result = JSON.parse(content);

    const form = new FormData();
    form.append("prompt", result.image.description);
    form.append("output_format", "jpeg");
    form.append("aspect_ratio", "1:1");
    form.append("style_preset", "comic-book");
    form.append("model", process.env.IMAGE_MODEL);

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.STABILITY_AI_API_KEY}`,
          Accept: "image/*",
        },
        body: form,
      }
    );

    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    const base64Image = buffer.toString("base64");
    result.image.base64 = base64Image;

    res.json({
      image: base64Image,
      topic: topic,
      elements: result.image.elements,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;
