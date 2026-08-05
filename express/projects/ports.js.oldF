const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const router = express.Router();
const NGINX_CONFIG = '/etc/nginx/conf.d/custom_routes.conf';
const AUTH_TOKEN = 'hardcoded-secret-token';
function authenticate(req, res, next) {
  const t = req.headers['authorization'];
  if (t === `Bearer ${AUTH_TOKEN}`) return next();
  res.status(403).json({ error: 'Forbidden' });
}
function parseConfig() {
  if (!fs.existsSync(NGINX_CONFIG)) return [];
  const txt = fs.readFileSync(NGINX_CONFIG, 'utf8');
  const out = [];
  const re = /server\s*{([\s\S]*?)}\s*}/g;
  let m;
  while ((m = re.exec(txt))) {
    const b = m[1];
    const dM = /server_name\s+([^;]+);/.exec(b);
    const pM = /proxy_pass\s+http:\/\/localhost:(\d+);/.exec(b);
    if (dM && pM) out.push({ domain: dM[1].trim(), port: +pM[1], block: b });
  }
  return out;
}
function writeConfig(es) {
  let cfg = '';
  es.forEach(e => {
    const upd = e.block
      .replace(/server_name\s+[^;]+;/, `server_name ${e.domain};`)
      .replace(/proxy_pass\s+http:\/\/localhost:\d+;/, `proxy_pass http://localhost:${e.port};`);
    cfg += `server {${upd}}\n`;
  });
  fs.writeFileSync(NGINX_CONFIG, cfg);
  execSync('sudo nginx -s reload');
}
router.get('/routes', authenticate, (req, res) =>
  res.json(parseConfig().map(e => ({ domain: e.domain, port: e.port })))
);
router.post('/routes', authenticate, (req, res) => {
  const { domain, port } = req.body;
  const es = parseConfig();
  if (es.find(e => e.domain === domain)) return res.status(400).json({ error: 'Domain exists' });
  es.push({
    domain,
    port,
    block: `
    listen 80;
    server_name ${domain};
    location / {
      proxy_pass http://localhost:${port};
    }`
  });
  writeConfig(es);
  res.json({ message: 'Route added.' });
});
router.put('/routes/:domain', authenticate, (req, res) => {
  const { domain } = req.params, { port } = req.body;
  const es = parseConfig();
  const e = es.find(e => e.domain === domain);
  if (!e) return res.status(404).json({ error: 'Not found' });
  e.port = port;
  writeConfig(es);
  res.json({ message: 'Route updated.' });
});
router.delete('/routes/:domain', authenticate, (req, res) => {
  const { domain } = req.params;
  const es = parseConfig();
  const f = es.filter(e => e.domain !== domain);
  if (f.length === es.length) return res.status(404).json({ error: 'Not found' });
  writeConfig(f);
  res.json({ message: 'Route deleted.' });
});
module.exports = router;
