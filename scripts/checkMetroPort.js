#!/usr/bin/env node
/*
 * Antes de levantar Expo, confirma que el puerto de Metro esté libre o,
 * si algo ya lo tiene tomado, que ese algo sea realmente Metro (y no un
 * servicio no relacionado escuchando en el mismo puerto en otra interfaz
 * de red, ej. IPv4 vs IPv6, como pasó con el httpd de PEM/pgAdmin en 8081).
 * Sin este chequeo, Expo Go termina hablándole al servicio equivocado y
 * falla con un error críptico en el celular en vez de acá, en la terminal.
 */
const http = require('http');

function checkMetroStatus(port, host) {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: '/status', timeout: 2000 }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ reachable: true, body }));
    });
    req.on('error', () => resolve({ reachable: false, body: '' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ reachable: false, body: '' });
    });
  });
}

// Decisión pura, sin red ni process.exit -- lo que se testea.
function evaluatePortStatus(port, result) {
  if (!result.reachable) {
    return { ok: true, message: null };
  }
  if (result.body.includes('packager-status:running')) {
    return { ok: true, message: null };
  }
  return {
    ok: false,
    message:
      `\nEl puerto ${port} ya está en uso, pero NO por Metro (la respuesta no fue ` +
      `"packager-status:running"). Si seguís, Expo Go puede terminar hablando ` +
      `con ese otro servicio y fallar con un error confuso en el celular en vez ` +
      `de acá.\n\nEjecutá esto para ver qué lo está usando:\n` +
      `  Get-NetTCPConnection -LocalPort ${port} -State Listen | ` +
      `Select-Object LocalAddress, OwningProcess\n` +
      `y despues Get-Process -Id <OwningProcess>.\n\n` +
      `Solución rápida: correr Expo en otro puerto, ej. ` +
      `"npx expo start --port ${port + 1}".\n\n`,
  };
}

async function main(port) {
  const result = await checkMetroStatus(port, '127.0.0.1');
  const { ok, message } = evaluatePortStatus(port, result);
  if (!ok) {
    process.stderr.write(message);
    process.exitCode = 1;
    return;
  }
  process.exitCode = 0;
}

module.exports = { checkMetroStatus, evaluatePortStatus, main };

if (require.main === module) {
  const port = Number(process.argv[2]) || 8081;
  main(port);
}
