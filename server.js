const express = require('express');
const https = require('https');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/buscar', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'Parâmetro q é obrigatório' });

  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=relevance`;

  const options = {
    hostname: 'api.mercadolibre.com',
    path: `/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=relevance`,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'application/json',
      'Accept-Language': 'pt-BR',
      'Cache-Control': 'no-cache'
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      if (response.statusCode !== 200) {
        console.error('ML error:', response.statusCode, data);
        return res.status(response.statusCode).json({ error: `ML API error: ${response.statusCode}` });
      }
      try {
        res.json(JSON.parse(data));
      } catch(e) {
        res.status(500).json({ error: 'Parse error' });
      }
    });
  });

  request.on('error', (e) => {
    console.error('Request error:', e.message);
    res.status(500).json({ error: e.message });
  });

  request.end();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
