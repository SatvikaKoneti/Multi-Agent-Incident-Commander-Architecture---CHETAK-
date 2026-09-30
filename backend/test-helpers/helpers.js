export async function bootTestServer() {
  const { initDatabase } = await import('../src/db/index.js');
  const { seedDatabase } = await import('../src/seed/index.js');
  const { initRagIfNeeded } = await import('../src/rag/init.js');
  const { createApp } = await import('../src/app.js');
  const { setAI } = await import('../src/di.js');
  const { FakeAIProvider } = await import('../src/ai/fake.js');

  await initDatabase();
  const stats = await seedDatabase({ force: true });
  await initRagIfNeeded();

  setAI(new FakeAIProvider());

  const app = createApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  return { base, server, stats };
}

export async function closeTestServer(server) {
  if (server) await new Promise((resolve) => server.close(resolve));
}

async function bodyOf(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function api(base, method, path, { token, body, headers = {} } = {}) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  return { status: res.status, data: await bodyOf(res), res };
}

export async function login(base, role) {
  const map = {
    citizen: 'citizen@hyd.city',
    planner: 'planner@hyd.city',
    authority: 'authority@hyd.city',
  };
  const { data } = await api(base, 'POST', '/api/auth/login', {
    body: { email: map[role], password: 'demo1234' },
  });
  return data.token;
}

export async function postComplaint(base, token, fields, files = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null) form.append(k, v);
  }
  if (files.image) form.append('image', files.image, 'test.png');
  if (files.video) form.append('video', files.video, 'test.mp4');
  return api(base, 'POST', '/api/complaints', { token, body: form, headers: {} });
}

export function tinyPngBuffer() {
  // 1x1 transparent PNG
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}

export function fakeVideoBuffer() {
  // Minimal bytes; multer validates by mimetype not content.
  const b64 = 'AAAAGGZ0eXBNNDQwAAAAAWlzbwAAAANpc29v';
  return Uint8Array.from(Buffer.from(b64, 'base64'));
}