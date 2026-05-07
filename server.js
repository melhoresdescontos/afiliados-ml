const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = '4091281663846000';
const CLIENT_SECRET = 'ZwWJy5rfZW4b6bCGgXERXUtDIIMZqW';
const REDIRECT_URI = 'https://afiliados-ml.onrender.com/callback';

let accessToken = null;
let tokenExpiry = 0;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Captura o código de autorização e troca por Access Token
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send('Erro: código não encontrado');
  try {
    const response = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}&redirect_uri=${REDIRECT_URI}`
    });
    const data = await response.json();
    if (data.access_token) {
      accessToken = data.access_token;
      tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      res.send(`<h1>✅ Autenticado com sucesso!</h1><p>Agora você pode <a href="/">usar a ferramenta</a>.</p>`);
    } else {
      res.send(`<h1>❌ Erro</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
    }
  } catch (error) {
    res.send(`<h1>❌ Erro</h1><p>${error.message}</p>`);
  }
});

app.get('/buscar', async (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q) return res.status(400).json({ error: 'Parâmetro q é obrigatório' });
  if (!accessToken) return res.status(401).json({ error: 'Não autenticado. Acesse /login primeiro.' });
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=relevance`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`ML API error: ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Erro na busca:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/login', (req, res) => {
  const url = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(url);
});

app.get('/health', (req, res) => res.json({ status: 'ok', autenticado: !!accessToken }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
