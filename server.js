const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.ML_CLIENT_ID || '4091281663846000';
const CLIENT_SECRET = process.env.ML_CLIENT_SECRET || 'ZwWJy5rfZW4b6bCGgXERXUtDIIMZqW';

let accessToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });
  const data = await res.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/buscar', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'Parâmetro q é obrigatório' });
  try {
    const token = await getToken();
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=relevance`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`ML API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro na busca:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
