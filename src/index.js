import { Hono } from 'hono';

const app = new Hono();

// HTML com interface para testar o Check-Host
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Host Checker & Tools</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
    .container { width: 100%; max-width: 500px; background-color: #1e293b; border-radius: 12px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h2 { margin-bottom: 16px; color: #38bdf8; text-align: center; }
    .form-group { display: flex; gap: 8px; margin-bottom: 16px; }
    input { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #334155; background-color: #0f172a; color: #fff; outline: none; }
    button { padding: 12px 18px; background-color: #a855f7; border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; }
    button:hover { background-color: #9333ea; }
    .result-box { background-color: #0f172a; border: 1px solid #334155; padding: 12px; border-radius: 8px; min-height: 100px; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap; }
    .status-online { color: #22c55e; }
    .status-offline { color: #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🌐 Check Host Status</h2>
    <div class="form-group">
      <input type="text" id="host-input" placeholder="Ex: google.com ou 1.1.1.1" required />
      <button onclick="checkHost()">Verificar</button>
    </div>
    <div id="result" class="result-box">Aguardando verificação...</div>
  </div>

  <script>
    async function checkHost() {
      const host = document.getElementById('host-input').value.trim();
      const resultDiv = document.getElementById('result');

      if (!host) {
        resultDiv.innerText = 'Por favor, insira um host ou IP válido.';
        return;
      }

      resultDiv.innerText = 'Verificando conexão...';

      try {
        const response = await fetch(\`/check?host=\${encodeURIComponent(host)}\`);
        const data = await response.json();

        if (data.success) {
          resultDiv.innerHTML = \`Host: \${data.host}\\nStatus: <span class="status-online">ONLINE (\${data.status})</span>\\nTempo de Resposta: \${data.ping}ms\`;
        } else {
          resultDiv.innerHTML = \`Host: \${data.host}\\nStatus: <span class="status-offline">OFFLINE / UNREACHABLE</span>\\nErro: \${data.error}\`;
        }
      } catch (err) {
        resultDiv.innerText = 'Erro ao processar a requisição.';
      }
    }
  </script>
</body>
</html>
  `);
});

// Endpoint da API de Check-Host
app.get('/check', async (c) => {
  let host = c.req.query('host');

  if (!host) {
    return c.json({ success: false, error: 'Parâmetro host é obrigatório' }, 400);
  }

  // Adiciona protocolo se não enviado
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = 'https://' + host;
  }

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

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
      error: error.name === 'AbortError' ? 'Timeout (Servidor não respondeu)' : 'Falha na conexão'
    });
  }
});

export default app;
