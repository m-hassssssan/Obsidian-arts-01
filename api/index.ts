import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../dist/boot.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = (req.headers['x-forwarded-host'] ?? req.headers['host'] ?? 'localhost') as string;
  const proto = (req.headers['x-forwarded-proto'] ?? 'https') as string;
  const url = `${proto}://${host}${req.url}`;

  // Read body from the Node.js stream
  const body = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

  const method = req.method ?? 'GET';
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, value);
    }
  }

  // Build a proper Web API Request with the body
  const fetchRequest = new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : new Uint8Array(body),
  });

  const response = await app.fetch(fetchRequest);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  const responseBuffer = await response.arrayBuffer();
  res.end(Buffer.from(responseBuffer));
}
