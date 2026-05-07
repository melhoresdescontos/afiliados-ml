const express = require('express');
const fetch = require('node-fetch');
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
  try {
    const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(q)}&limit=${limit}&sort=relevance`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.mercadolivre.com.br/',
        'Origin': 'https://www.mercadolivre.com.br'
      }
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
