import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');

function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForLine(child, matcher, timeoutMs = 5000) {
  let output = '';
  return await new Promise((resolveLine, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${matcher}; output=${output}`));
    }, timeoutMs);
    const onData = chunk => {
      output += chunk.toString();
      const match = output.match(matcher);
      if (match) {
        cleanup();
        resolveLine(match);
      }
    };
    const onExit = code => {
      cleanup();
      reject(new Error(`server exited early with ${code}; output=${output}`));
    };
    function cleanup() {
      clearTimeout(timer);
      child.stdout?.off('data', onData);
      child.stderr?.off('data', onData);
      child.off('exit', onExit);
    }
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('exit', onExit);
  });
}

test('serve.mjs falls back to the next free port when the requested port is occupied', async (t) => {
  const requestedPort = await getFreePort();
  const blocker = createServer((req, res) => res.end('occupied'));
  blocker.listen(requestedPort, '127.0.0.1');
  await once(blocker, 'listening');
  t.after(() => blocker.close());

  const child = spawn(process.execPath, ['scripts/serve.mjs', 'dist', String(requestedPort)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill('SIGTERM'));

  const match = await waitForLine(child, /Sky Aegis running at http:\/\/127\.0\.0\.1:(\d+)\//);
  const actualPort = Number(match[1]);
  assert.notEqual(actualPort, requestedPort);
  assert.ok(actualPort > requestedPort, 'fallback port should be higher than requested port');

  const response = await fetch(`http://127.0.0.1:${actualPort}/`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Sky Aegis/i);
});
