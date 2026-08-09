import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check-Host.cc</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <canvas id="rain-canvas"></canvas>

  <div class="main-wrapper">
    <div class="header-logo">Check-Host.cc</div>

    <div class="search-card">
      <div class="search-bar">
        <div class="search-input-wrapper">
          <input type="text" id="host-input" placeholder="panelaosupermercados.com.br" value="panelaosupermercados.com.br" />
        </div>
        <button class="btn-search" onclick="checkHost()">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div class="nav-tabs">
        <div class="tab-item">Info</div>
        <div class="tab-item">Ping</div>
        <div class="tab-item active">HTTP</div>
        <div class="tab-item">TCP</div>
        <div class="tab-item">UDP</div>
        <div class="tab-item">MTR</div>
        <div class="tab-item">DNS</div>
      </div>
    </div>

    <div class="results-card">
      <div class="target-info">
        <div>
          <div class="target-title">Verificar site</div>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Link permanente | Compartilhar</div>
        </div>
        <div id="target-url-display" class="target-url">https://panelaosupermercados.com.br</div>
      </div>

      <div id="results-list" class="host-list">
        <!-- Resultados inseridos dinamicamente -->
      </div>
    </div>
  </div>

  <script>
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

    // Lógica do Check
    async function checkHost() {
      const hostInput = document.getElementById('host-input');
      const resultsList = document.getElementById('results-list');
      const urlDisplay = document.getElementById('target-url-display');
      const host = hostInput.value.trim();

      if (!host) return;

      urlDisplay.innerText = host.startsWith('http') ? host : 'https://' + host;
      resultsList.innerHTML = '<div style="text-align: center; padding: 20px;"><span class="spinner"></span></div>';

      try {
        const response = await fetch(\`/check?host=\${encodeURIComponent(host)}\`);
        const data = await response.json();

        if (data.results) {
          let html = '';
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
          resultsList.innerHTML = html;
        }
      } catch (err) {
        resultsList.innerHTML = '<div style="color:#ef4444; text-align:center;">Erro ao processar consulta</div>';
      }
    }

    // Executa uma consulta inicial ao carregar a página
    checkHost();
  </script>
</body>
</html>
  `);
});

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

  // Cidades do print da imagem
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
