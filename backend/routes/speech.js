const express = require('express');
const https = require('https');

const router = express.Router();

router.post('/synthesize', async (req, res) => {

  try {

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    const key = process.env.ELEVENLABS_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    const body = JSON.stringify({
      text: text.substring(0, 4000),
      model_id: "eleven_multilingual_v2"
    });

    const audio = await new Promise((resolve, reject) => {

      const req = https.request({

        hostname: 'api.elevenlabs.io',
        path: '/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL',
        method: 'POST',

        headers: {
          'xi-api-key': key,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }

      }, (response) => {

        const chunks = [];

        response.on('data', chunk => chunks.push(chunk));

        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

      });

      req.on('error', reject);

      req.write(body);
      req.end();

    });

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audio.length
    });

    res.send(audio);

  } catch (err) {

    console.error("Speech error:", err);
    res.status(500).json({ error: err.message });

  }

});

module.exports = router;