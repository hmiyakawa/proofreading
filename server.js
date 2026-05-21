const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(process.cwd())));

app.post('/api/proofread', async (req, res) => {
  const text = req.body?.text;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'テキストを送信してください。' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: '環境変数 ANTHROPIC_API_KEY が設定されていません。' });
  }

  const prompt = `以下の日本語文章を丁寧に校正してください。必要に応じて日本語表現をわかりやすく整え、変更した内容は最後に説明してください。\n\n文章:\n${text}\n\n校正後の文章:`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        temperature: 0.2,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText || 'Claude APIからの応答でエラーが発生しました。' });
    }

    const data = await response.json();
    const proofread = data.content?.[0]?.text ?? '';
    return res.json({ proofread: proofread.toString().trim() });
  } catch (error) {
    return res.status(500).json({ error: error.message || '校正処理に失敗しました。' });
  }
});

app.listen(port, () => {
  console.log(`Proofreading server listening at http://localhost:${port}`);
});
