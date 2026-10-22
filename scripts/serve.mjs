import { createServer } from 'node:http';
import worker from '../dist/worker.mjs';

const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
const server = createServer(async (incoming, outgoing) => {
  incoming.resume();
  try {
    const url = new URL(incoming.url || '/', `http://127.0.0.1:${port}`);
    const request = new Request(url, { method: incoming.method || 'GET', headers: incoming.headers });
    const response = await worker.fetch(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Local preview request failed:', error.message);
    if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    outgoing.end('Local preview error');
  }
});
server.on('error', (error) => {
  console.error('Local preview could not start:', error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
