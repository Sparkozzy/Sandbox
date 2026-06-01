const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security headers
app.use(helmet({ contentSecurityPolicy: false }));

// 2. Rate limiter for the submission endpoint
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas solicitações deste IP. Tente novamente após 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Middleware
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json({ limit: '50kb' }));

// 4. Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/print', (req, res) => {
  res.sendFile(path.join(__dirname, 'print.html'));
});

app.get('/print-classic', (req, res) => {
  res.sendFile(path.join(__dirname, 'print-classic.html'));
});

// 5. POST /api/submit-lead (for "Testar IA" form)
app.post('/api/submit-lead', submitLimiter, async (req, res) => {
  const { nome, telefone, email, contexto } = req.body;

  if (!nome || typeof nome !== 'string' || !telefone || typeof telefone !== 'string') {
    return res.status(400).json({ error: "Nome e telefone são obrigatórios." });
  }

  const apiUrl = process.env.WEBHOOK_URL || "https://call-github.bkpxmb.easypanel.host/webhook";
  const apiKey = process.env.WEBHOOK_API_KEY;

  try {
    const axios = require('axios');
    const { v4: uuidv4 } = require('uuid');
    const executionId = uuidv4();

    const payload = {
      nome: nome.toUpperCase(),
      email: email || "",
      numero: telefone,
      contexto: contexto || "Teste via apresentação institucional",
      agent_id: process.env.AGENT_ID || "agent_2117bcaaf68e8b7cc8e0d160f7",
      Prompt_id: process.env.PROMPT_ID || "12",
      execution_id: executionId,
      quando_ligar: "",
      workflow_name: "pre_call_processing"
    };

    const response = await axios.post(apiUrl, payload, {
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      timeout: 10000
    });

    return res.status(202).json({ message: "Lead processado.", execution_id: executionId });
  } catch (error) {
    console.error("[BFF ERROR]", error.response?.data || error.message);
    return res.status(500).json({ error: "Erro ao processar solicitação." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Apresentação MindFlow rodando em http://localhost:${PORT}`);
});
