const http = require('http');
const { checkMetroStatus, evaluatePortStatus } = require('../checkMetroPort');

// Regresión: un servicio no relacionado (ej. el httpd de PEM/pgAdmin) puede
// terminar escuchando en el mismo puerto que Metro (en otra interfaz de red,
// IPv4 vs IPv6), y Expo Go entonces le habla al servicio equivocado en vez de
// a Metro, fallando con un error confuso en el celular ("Failed to download
// remote update") en vez de acá, en la terminal.
describe('evaluatePortStatus', () => {
  it('permite continuar si el puerto está libre (nada responde)', () => {
    const { ok, message } = evaluatePortStatus(8082, { reachable: false, body: '' });
    expect(ok).toBe(true);
    expect(message).toBeNull();
  });

  it('permite continuar si lo que responde en el puerto es Metro', () => {
    const { ok, message } = evaluatePortStatus(8082, {
      reachable: true,
      body: 'packager-status:running',
    });
    expect(ok).toBe(true);
    expect(message).toBeNull();
  });

  it('bloquea si el puerto responde pero no es Metro (ej. otro servicio local)', () => {
    const { ok, message } = evaluatePortStatus(8081, {
      reachable: true,
      body: '<html>Apache is running</html>',
    });
    expect(ok).toBe(false);
    expect(message).toContain('8081');
    expect(message).toContain('NO por Metro');
  });
});

describe('checkMetroStatus', () => {
  let server;
  let port;

  afterEach((done) => {
    if (server) {
      server.close(done);
      server = undefined;
    } else {
      done();
    }
  });

  it('detecta un puerto libre como no alcanzable', async () => {
    // Puerto que no abrimos server en este test -- nada debería responder.
    const result = await checkMetroStatus(8079, '127.0.0.1');
    expect(result.reachable).toBe(false);
  });

  it('detecta el status real de Metro cuando el puerto está ocupado por Metro', async () => {
    await new Promise((resolve) => {
      server = http.createServer((req, res) => {
        res.end('packager-status:running');
      });
      server.listen(0, '127.0.0.1', resolve);
    });
    port = server.address().port;

    const result = await checkMetroStatus(port, '127.0.0.1');

    expect(result.reachable).toBe(true);
    expect(result.body).toBe('packager-status:running');
  });

  it('detecta cuando el puerto responde pero con contenido de otro servicio', async () => {
    await new Promise((resolve) => {
      server = http.createServer((req, res) => {
        res.end('<html>not metro</html>');
      });
      server.listen(0, '127.0.0.1', resolve);
    });
    port = server.address().port;

    const result = await checkMetroStatus(port, '127.0.0.1');
    const { ok } = evaluatePortStatus(port, result);

    expect(result.reachable).toBe(true);
    expect(ok).toBe(false);
  });
});
