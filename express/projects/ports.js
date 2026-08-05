const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const router = express.Router();

const NGINX_CONFIG = '/etc/nginx/conf.d/custom_routes.conf';
const AUTH_TOKEN = 'hardcoded-secret-token';

// Middleware to check auth header
function authenticate(req, res, next) {
  const t = req.headers['authorization'];
  if (t === `Bearer ${AUTH_TOKEN}`) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// Parse existing NGINX config
function parseConfig() {
  if (!fs.existsSync(NGINX_CONFIG)) return [];
  const txt = fs.readFileSync(NGINX_CONFIG, 'utf8');
  const out = [];

  // Regex to match entire server blocks
  const re = /server\s*{([\s\S]*?)}\s*/g;
  let m;
  while ((m = re.exec(txt))) {
    const b = m[1];
    const dM = /server_name\s+([^;]+);/.exec(b);
    const pM = /proxy_pass\s+http:\/\/localhost:(\d+);/.exec(b);
    if (dM && pM) {
      out.push({
        domain: dM[1].trim(),
        port: +pM[1],
        block: `server {\n${b}\n}`
      });
    }
  }
  return out;
}

// Write updated config and reload nginx
function writeConfig(entries) {
  const cfg = entries.map(e => {
    return `server {
    listen 80;
    server_name ${e.domain};
    location / {
        proxy_pass http://localhost:${e.port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}\n`;
  }).join('\n');

  fs.writeFileSync(NGINX_CONFIG, cfg);
  execSync('sudo nginx -s reload');
}

// Routes
router.get('/routes', authenticate, (req, res) =>
  res.json(parseConfig().map(e => ({ domain: e.domain, port: e.port })))
);

router.post('/routes', authenticate, (req, res) => {
  const { domain, port } = req.body;
  const entries = parseConfig();
  if (entries.find(e => e.domain === domain)) {
    return res.status(400).json({ error: 'Domain exists' });
  }
  entries.push({ domain, port });
  writeConfig(entries);
  res.json({ message: 'Route added.' });
});

router.put('/routes/:domain', authenticate, (req, res) => {
  const { domain } = req.params;
  const { port } = req.body;
  const entries = parseConfig();
  const target = entries.find(e => e.domain === domain);
  if (!target) return res.status(404).json({ error: 'Not found' });
  target.port = port;
  writeConfig(entries);
  res.json({ message: 'Route updated.' });
});

router.delete('/routes/:domain', authenticate, (req, res) => {
  const { domain } = req.params;
  const entries = parseConfig();
  const filtered = entries.filter(e => e.domain !== domain);
  if (filtered.length === entries.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  writeConfig(filtered);
  res.json({ message: 'Route deleted.' });
});

module.exports = router;
