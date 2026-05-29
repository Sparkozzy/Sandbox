const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'mindflow-hub-dev-secret-change-in-production';

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8h
  },
}));

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function requireAuth(req, res, next) {
  const publicPaths = ['/', '/api/login', '/api/check', '/api/logout'];
  if (req.session?.user) return next();
  if (publicPaths.includes(req.path)) return next();
  if (/\.(html|js|css|svg|png|ico)$/.test(req.path)) return res.redirect('/');
  res.status(401).json({ error: 'Unauthorized' });
}

app.use(requireAuth);

// ============================================================
// ROTAS
// ============================================================
app.get('/', (req, res) => {
  if (req.session?.user) return res.redirect('/hub');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/hub', (req, res) => {
  if (!req.session?.user) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'hub.html'));
});

// ============================================================
// API: LOGIN — TODO: Integrar com Supabase Auth
// ============================================================
app.post('/api/login', (req, res) => {
  // TODO: substituir pela integração com Supabase Auth
  // Ver branch: feature/supabase-auth
  res.status(501).json({ error: 'Login não implementado ainda.' });
});

app.get('/api/check', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ name: req.session.user.name });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.get('/api/platforms', (req, res) => {
  if (!req.session?.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(PLATFORMS);
});

// ============================================================
// START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`MindFlow Hub rodando em http://0.0.0.0:${PORT}`);
});

// ============================================================
// PLATFORM CONFIG — edite as URLs aqui
// ============================================================
const PLATFORMS = [
  { id: 'supabase',   name: 'Supabase',            description: 'Banco de dados e autenticação',          url: 'https://supabase.com/dashboard/org/sdkymfktruvsdlqmkqeh',                                                                                      icon: 'database' },
  { id: 'n8n',        name: 'n8n',                 description: 'Automação de workflows',                 url: 'https://n8n-mcp-n8n.bkpxmb.easypanel.host/projects/Lf5I2sykx1cKIGxc/workflows',                                                              icon: 'account_tree' },
  { id: 'hostinger',  name: 'Hostinger',           description: 'Hospedagem e domínios',                  url: 'https://hpanel.hostinger.com/',                                                                                                                  icon: 'dns' },
  { id: 'easypanel',  name: 'Easypanel',           description: 'Deploy e gerenciamento de servidores',   url: 'https://easypanel.io',                                                                                                                           icon: 'rocket_launch' },
  { id: 'mlflow',     name: 'MLFlow',              description: 'Track de experimentos ML',               url: 'https://mlflow.mindflow-ia.com/#/',                                                                                                              icon: 'experiment' },
  { id: 'github',     name: 'GitHub',              description: 'Sparkozzy — repositórios de código',     url: 'https://github.com/Sparkozzy',                                                                                                                   icon: 'code' },
  { id: 'zapi',       name: 'Z-API',               description: 'API de WhatsApp',                        url: 'https://app.z-api.io/app',                                                                                                                       icon: 'chat' },
  { id: 'trello-pi',  name: 'Trello PI',           description: 'Projetos Internos',                      url: 'https://trello.com/b/A7PITYlb/projetos-internos',                                                                                               icon: 'view_kanban' },
  { id: 'trello-pe',  name: 'Trello PE',           description: 'Projetos Externos',                      url: 'https://trello.com/b/uxzdcvl3/projetos-externos',                                                                                               icon: 'view_kanban' },
  { id: 'retell',     name: 'Retell AI',           description: 'Dashboard de voz e telefonia',           url: 'https://dashboard.retellai.com/agents',                                                                                                          icon: 'phone_in_talk' },
  { id: 'formulario', name: 'Disparo de Ligação',  description: 'Formulário de chamadas MindFlow',        url: 'https://mindflow-form.mindflow-ia.com',                                                                                                          icon: 'smart_toy' },
  { id: 'planilha',   name: 'Planilha de Acessos', description: 'Senhas e logins das plataformas',        url: 'https://docs.google.com/spreadsheets/d/1ONK3dt-YjmPG-zEDoOluPuH-44uMrDt-m5lZEBZtbDg/edit?pli=1&gid=894756518#gid=894756518', icon: 'key' },
];
