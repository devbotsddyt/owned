import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check Host Pro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    
    body { 
      background: radial-gradient(circle at top, #0f172a, #020617);
      color: #f8fafc; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh; 
      padding: 16px;
    }

    .container { 
      width: 100%; 
      max-width: 580px; 
      background: rgba(30, 41, 59, 0.7); 
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; 
      padding: 24px; 
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.15);
      animation: fadeIn 0.4s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    h2 { 
      margin-bottom: 20px; 
      color: #38bdf8; 
      text-align: center; 
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
    }

    .form-group { 
      display: flex; 
      flex-direction: column;
      gap: 10px; 
      margin-bottom: 20px; 
    }

    @media (min-width: 480px) {
      .form-group { flex-direction: row; }
    }

    input { 
      flex: 1; 
      padding: 14px 16px; 
      border-radius: 10px; 
      border: 1px solid #334155; 
      background-color: #0f172a; 
      color: #38bdf8; 
      font-size: 0.95rem;
      outline: none; 
      transition: all 0.3s ease;
    }

    input:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
    }

    button { 
      padding: 14px 20px; 
      background: linear-gradient(135deg, #a855f7, #6366f1); 
      border: none; 
      border-radius: 10px; 
      color: #fff; 
      font-weight: 600; 
      cursor: pointer; 
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    button:hover { 
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(168, 85, 247, 0.4);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .result-box { 
      background-color: #0f172a; 
      border: 1px solid #334155; 
      padding: 16px; 
      border-radius: 10px; 
      font-family: 'Fira Code', monospace, sans-serif; 
      font-size: 0.9rem; 
      line-height: 1.6;
      word-break: break-all;
      overflow-wrap: anywhere;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 0.85rem;
      margin-top: 4px;
    }

    .online { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e; }
    .offline { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }

    .ping-text {
      color: #38bdf8;
      font-weight: bold;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #fff;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>🌐 Check Host Status</h2>
    <div class="form-group">
      <input type="text" id="host-input" placeholder="Ex: google.com ou panelaosupermercados.com.br" required />
      <button id="btn-check" onclick="checkHost()">Verificar</button>
    </div>
    <div id="result" class="result-box">Aguardando verificação...</div>
  </div>

  <script>
    async function checkHost() {
      const hostInput = document.getElementById('host-input');
      const btn = document.getElementById('btn-check');
      const resultDiv = document.getElementById('result');
      const host = hostInput.value.trim();

      if (!host) {
        resultDiv.innerText = '⚠️ Por favor, insira um host ou IP válido.';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Checando...';
      resultDiv.innerText = '📡 Testando conexão e latência...';

      try {
        const response = await fetch(\`/check?host=\${encodeURIComponent(host)}\`);
        const data = await response.json();

        if (data.success) {
          resultDiv.innerHTML = \`
<strong>Host:</strong> \${escapeHtml(data.host)}<br>
<strong>Status:</strong> <span class="status-badge online">ONLINE (\${data.status})</span><br>
<strong>Tempo de Resposta:</strong> <span class="ping-text">\${data.ping}ms</span>
          \`;
        } else {
          resultDiv.innerHTML = \`
<strong>Host:</strong> \${escapeHtml(data.host)}<br>
<strong>Status:</strong> <span class="status-badge offline">OFFLINE / INDISPONÍVEL</span><br>
<strong>Detalhes:</strong> \${escapeHtml(data.error)}
          \`;
        }
      } catch (err) {
        resultDiv.innerText = '❌ Erro ao conectar com a API de teste.';
      } finally {
        btn.disabled = false;
        btn.innerText = 'Verificar';
      }
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.innerText = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>
  `);
});

app.get('/check', async (c) => {
  let host = c.req.query('host');

  if (!host) {
    return c.json({ success: false, error: 'Parâmetro host é obrigatório' }, 400);
  }

  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = 'https://' + host;
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(host, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'User-Agent': 'CheckHost-Bot/1.0' }
    });

    clearTimeout(timeoutId);
    const ping = Date.now() - startTime;

    return c.json({
      success: true,
      host: host,
      status: res.status,
      ping: ping
    });

  } catch (error) {
    return c.json({
      success: false,
      host: host,
      error: error.name === 'AbortError' ? 'Timeout (Servidor não respondeu em 5s)' : 'Falha ao resolver DNS ou conectar'
    });
  }
});

export default app;
