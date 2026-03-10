const express = require('express');
const https = require('https');
const fs = require('fs');

const router = express.Router();

router.post('/transcribe', async (req, res) => {

  try {

    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return res.status(500).json({ error: "Groq API key not configured" });
    }

    const audio = fs.readFileSync(req.file.path);

    const boundary = "----NodeBoundary";

    const start = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n` +
      `Content-Type: audio/wav\r\n\r\n`
    );

    const end = Buffer.from(`\r\n--${boundary}--`);

    const body = Buffer.concat([start, audio, end]);

    const result = await new Promise((resolve, reject) => {

      const req = https.request({

        hostname: 'api.groq.com',
        path: '/openai/v1/audio/transcriptions',
        method: 'POST',

        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }

      }, (response) => {

        let data = '';

        response.on('data', c => data += c);

        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.text);
          } catch {
            reject(new Error("Groq response parse error"));
          }
        });

      });

      req.on('error', reject);

      req.write(body);
      req.end();

    });

    res.json({ success: true, text: result });

  } catch (err) {

    console.error("Transcription error:", err);
    res.status(500).json({ error: err.message });

  }

});

module.exports = router;