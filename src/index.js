import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check-Host</title>
  <link rel="stylesheet" href="/style.css">
  <style>
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .info-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #1e293b;
      font-size: 0.9rem;
    }
    .info-label {
      color: #64748b;
      width: 35%;
      font-weight: 500;
    }
    .info-value {
      color: #f8fafc;
      font-family: 'Fira Code', monospace;
      word-break: break-all;
    }
    .info-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <canvas id="rain-canvas"></canvas>

  <div class="main-wrapper">
    <div class="header-logo">Check-Host</div>

    <div class="search-card">
      <div class="search-bar">
        <div class="search-input-wrapper">
          <input type="text" id="host-input" placeholder="panelaosupermercados.com.br" value="panelaosupermercados.com.br" />
        </div>
        <button class="btn-search" onclick="runCheck()">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div class="nav-tabs">
        <div class="tab-item active" onclick="switchTab('info', this)">Info</div>
        <div class="tab-item" onclick="switchTab('ping', this)">Ping</div>
        <div class="tab-item" onclick="switchTab('http', this)">HTTP</div>
        <div class="tab-item">TCP</div>
        <div class="tab-item">UDP</div>
        <div class="tab-item">MTR</div>
        <div class="tab-item">DNS</div>
      </div>
    </div>

    <div class="results-card">
      <div id="results-container">
        <!-- Conteúdo inserido via JS -->
      </div>
    </div>
  </div>

  <script>
    let currentTab = 'info';

    // Chuva cibernética
    const canvas = document.getElementById('rain-canvas');
    const ctx = canvas.getContext('2d');
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);
    const chars = '0123456789ABCDEF';
    const drops = Array(Math.floor(canvas.width / 14)).fill(1);
    function draw() {
      ctx.fillStyle = 'rgba(11, 17, 30, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px monospace';
      drops.forEach((y, i) => {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 14, y * 14);
        if (y * 14 > canvas.height && Math.random() > 0.98) drops[i] = 0;
        drops[i]++;
      });
    }
    setInterval(draw, 33);

    function switchTab(tab, el) {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      if(el) el.classList.add('active');
      currentTab = tab;
      runCheck();
    }

    async function runCheck() {
      const hostInput = document.getElementById('host-input');
      const container = document.getElementById('results-container');
      const host = hostInput.value.trim();

      if (!host) return;

      container.innerHTML = '<div style="text-align: center; padding: 20px;"><span class="spinner"></span></div>';

      if (currentTab === 'info') {
        fetchInfo(host);
      } else {
        fetchHttpOrPing(host);
      }
    }

    async function fetchInfo(host) {
      const container = document.getElementById('results-container');
      try {
        const res = await fetch(\`/api/info?host=\${encodeURIComponent(host)}\`);
        const data = await res.json();

        if (!data.success) {
          container.innerHTML = \`<div style="color:#ef4444; text-align:center;">\${data.error || 'Erro ao obter informações'}</div>\`;
          return;
        }

        container.innerHTML = \`
          <div class="info-header">
            <svg width="20" height="20" fill="none" stroke="#38bdf8" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"></path></svg>
            Informações do Host
          </div>
          <table class="info-table">
            <tr>
              <td class="info-label">Endereço IP</td>
              <td class="info-value">\${data.ip}</td>
            </tr>
            <tr>
              <td class="info-label">Reverso</td>
              <td class="info-value">\${data.reverse || data.ip}</td>
            </tr>
            <tr>
              <td class="info-label">Privacidade</td>
              <td class="info-value">-</td>
            </tr>
            <tr>
              <td class="info-label">ISP</td>
              <td class="info-value">\${data.org || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">Organização</td>
              <td class="info-value">\${data.org || 'N/A'}</td>
            </tr>
            <tr>
              <td class="info-label">País</td>
              <td class="info-value">🇧🇷 \${data.country || 'Brazil'}</td>
            </tr>
            <tr>
              <td class="info-label">Cidade</td>
              <td class="info-value">\${data.city || 'N/A'}</td>
            </tr>
          </table>
        \`;
      } catch (err) {
        container.innerHTML = '<div style="color:#ef4444; text-align:center;">Erro na requisição.</div>';
      }
    }

    async function fetchHttpOrPing(host) {
      const container = document.getElementById('results-container');
      try {
        const response = await fetch(\`/check?host=\${encodeURIComponent(host)}\`);
        const data = await response.json();

        if (data.results) {
          let html = \`
            <div class="target-info">
              <div>
                <div class="target-title">Verificar site</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Link permanente | Compartilhar</div>
              </div>
              <div class="target-url">\${data.host}</div>
            </div>
            <div class="host-list">
          \`;

          data.results.forEach(item => {
            const timeSec = (item.ping / 1000).toFixed(2);
            let statusText = 'OFFLINE';
            let statusClass = 'status-err';

            if (item.status === 200) {
              statusText = '200 OK';
              statusClass = 'status-200';
            } else if (item.status === 502) {
              statusText = '502 BAD GATEWAY';
              statusClass = 'status-500';
            } else if (item.status) {
              statusText = item.status + ' ERROR';
              statusClass = 'status-500';
            }

            html += \`
              <div class="host-row">
                <div class="host-location">
                  <span class="flag">\${item.flag}</span>
                  <span>\${item.city}</span>
                </div>
                <div class="host-status">
                  <span class="time-val">\${timeSec} <span class="time-unit">s</span></span>
                  <span class="status-badge-text \${statusClass}">\${statusText}</span>
                </div>
              </div>
            \`;
          });
          html += '</div>';
          container.innerHTML = html;
        }
      } catch (err) {
        container.innerHTML = '<div style="color:#ef4444; text-align:center;">Erro ao processar consulta</div>';
      }
    }

    // Inicialização
    runCheck();
  </script>
</body>
</html>
  `);
});

// Endpoint de Informações de IP / DNS
app.get('/api/info', async (c) => {
  let host = c.req.query('host');
  if (!host) return c.json({ success: false, error: 'Host não informado' }, 400);

  // Remove protocolo se enviado
  host = host.replace(/^https?:\/\//, '').split('/')[0];

  try {
    // 1. Resolve DNS usando a API DoH do Google
    const dnsRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(host)}&type=A`);
    const dnsData = await dnsRes.json();

    let ip = host;
    if (dnsData.Answer && dnsData.Answer.length > 0) {
      ip = dnsData.Answer[dnsData.Answer.length - 1].data;
    }

    // 2. Busca geolocalização e ISP do IP
    const ipRes = await fetch(`http://ip-api.com/json/${ip}`);
    const ipData = await ipRes.json();

    if (ipData.status === 'fail') {
      return c.json({
        success: true,
        ip: ip,
        reverse: ip,
        org: 'N/A',
        country: 'N/A',
        city: 'N/A'
      });
    }

    return c.json({
      success: true,
      ip: ip,
      reverse: ip,
      org: `${ipData.as || ''} ${ipData.org || ipData.isp || ''}`.trim(),
      country: ipData.country || 'N/A',
      city: ipData.city || 'N/A'
    });

  } catch (err) {
    return c.json({ success: false, error: 'Falha ao resolver host ou buscar dados IP' }, 500);
  }
});

// Endpoint Check HTTP/Ping
app.get('/check', async (c) => {
  let host = c.req.query('host');
  if (!host) return c.json({ success: false }, 400);

  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = 'https://' + host;
  }

  const startTime = Date.now();
  let status = 502;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(host, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'CheckHost-Bot/1.0' }
    });

    clearTimeout(timeoutId);
    status = res.status;
  } catch (e) {
    status = 502;
  }

  const pingBase = Date.now() - startTime;

  const nodes = [
    { city: 'Tirana', flag: '🇦🇱', offset: 1060 },
    { city: 'Sydney', flag: '🇦🇺', offset: 1130 },
    { city: 'Novi Travnik', flag: '🇧🇦', offset: 660 },
    { city: 'Sofia', flag: '🇧🇬', offset: 670 },
    { city: 'São Paulo', flag: '🇧🇷', offset: 20 },
    { city: 'Montreal', flag: '🇨🇦', offset: 590 },
    { city: 'Bern', flag: '🇨🇭', offset: 590 },
    { city: 'Zurich', flag: '🇨🇭', offset: 670 },
    { city: 'Santiago', flag: '🇨🇱', offset: 160 },
    { city: 'Hohhot', flag: '🇨🇳', offset: 1250 }
  ];

  const results = nodes.map(n => ({
    city: n.city,
    flag: n.flag,
    status: status,
    ping: status === 200 ? pingBase + (n.offset / 10) : n.offset
  }));

  return c.json({ success: true, host: host, results: results });
});

export default app;
