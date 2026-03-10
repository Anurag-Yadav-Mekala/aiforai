const https = require('https');

async function callAzureOpenAI(messages, maxTokens = 2000, jsonMode = false) {
  const key = process.env.OPENAI_API_KEY;

  if (!key || key === 'your_openai_key_here') {
    throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY to .env file.');
  }

  const body = JSON.stringify({
    model: 'gpt-4o',
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.choices[0].message.content);
        } catch(e) { reject(new Error('Failed to parse response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callAzureOpenAI };