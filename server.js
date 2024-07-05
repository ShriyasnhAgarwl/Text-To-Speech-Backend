const express = require("express");
const textToSpeech = require("@google-cloud/text-to-speech");
const cors = require("cors"); // Import CORS
require("dotenv").config();

const app = express();

// Parse the credentials JSON from the environment variable
let CREDENTIALS;

try {
  CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
} catch (error) {
  console.error("Error parsing CREDENTIALS:", error);
  process.exit(1); // Exit the process if credentials are invalid
}

// Initialize the TextToSpeech client with credentials
const client = new textToSpeech.TextToSpeechClient({
  credentials: CREDENTIALS,
  projectId: CREDENTIALS.project_id,
});

const corsOptions = {
  origin: "http://localhost:3000", // Update this to your frontend's URL
  optionsSuccessStatus: 200,
};

// Use CORS middleware
app.use(cors(corsOptions));

// Middleware to parse JSON bodies
app.use(express.json());

app.post("/synthesize", async (req, res) => {
  const {
    text,
    languageCode = "en-US",
    voiceName = "en-US-Wavenet-D",
    speakingRate = 1.0,
  } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  const request = {
    input: { text },
    voice: { languageCode, name: voiceName },
    audioConfig: { audioEncoding: "MP3", speakingRate },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);

    // Set the response headers for audio content
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'attachment; filename="output.mp3"',
    });

    // Send the audio content directly in the response
    res.send(response.audioContent);
  } catch (error) {
    console.error("Error synthesizing speech:", error);
    res.status(500).json({ error: "Error synthesizing speech" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
