// ============================================================
// YAY by netals — Server-Side Proxy Route (App Router)
// Browser → /api/proxy/* → Next.js server → VPS tunnel
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzmLCeDZOjeDN22BVFlw2QAwilEQo-inOw3SOLfzgg5WKKiFj5-Zba1kXoMz-I_iqietA/exec';
const GAS_TOKEN = 'NETALS_SECURE_SECRET_2026_XYZ';
const CF_IP = '104.16.231.132';

let cachedVpsUrl = process.env.NEXT_PUBLIC_API_URL || '';
let lastFetchTime = 0;

let lastFetchError = '';

async function getVpsUrl(): Promise<string> {
  if (cachedVpsUrl && (Date.now() - lastFetchTime < 5 * 60 * 1000)) return cachedVpsUrl;
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth_token: GAS_TOKEN, action: 'get_tunnel_url' }),
      redirect: 'follow',
      cache: 'no-store'
    });
    const data = await res.json();
    if (data.status === 'success' && data.url) {
      cachedVpsUrl = data.url;
      lastFetchTime = Date.now();
      lastFetchError = '';
    } else {
      lastFetchError = 'GAS Error: ' + JSON.stringify(data);
    }
  } catch (err: any) {
    lastFetchError = 'Fetch Error: ' + err.message;
  }
  return cachedVpsUrl;
}

type Params = Promise<{ path: string[] }>;

export async function GET(req: NextRequest, { params }: { params: Params }) { return proxy(req, await params, 'GET'); }
export async function POST(req: NextRequest, { params }: { params: Params }) { return proxy(req, await params, 'POST'); }
export async function PUT(req: NextRequest, { params }: { params: Params }) { return proxy(req, await params, 'PUT'); }
export async function DELETE(req: NextRequest, { params }: { params: Params }) { return proxy(req, await params, 'DELETE'); }

async function proxy(req: NextRequest, params: { path: string[] }, method: string) {
  const vpsUrl = await getVpsUrl();
  if (!vpsUrl) return NextResponse.json({ status: 'error', message: `VPS URL tidak ditemukan. Detail: ${lastFetchError}` }, { status: 503 });

  const parsedUrl = new URL(vpsUrl);
  const hostname = parsedUrl.hostname;
  const targetPath = '/api/' + params.path.join('/');

  let bodyData: Buffer | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    try { 
      const arrayBuffer = await req.arrayBuffer();
      bodyData = Buffer.from(arrayBuffer);
    } catch (_) {}
  }

  // Gunakan modul Node.js https asli untuk bypass DNS
  // Hubungkan langsung ke IP Cloudflare, tapi kirim SNI (servername) dan Host header yang benar
  return new Promise<NextResponse>((resolve) => {
    const reqContentType = req.headers.get('Content-Type') || 'application/json';

    const options: https.RequestOptions = {
      method: method,
      hostname: CF_IP, // IP Langsung (Bypass DNS)
      port: 443,

      path: targetPath,
      headers: {
        'Host': hostname, // Supaya Cloudflare tau tujuan aslinya
        'Content-Type': reqContentType,
        'Bypass-Tunnel-Reminder': 'true'
      },
      servername: hostname, // Penting untuk SSL/TLS (SNI) supaya sertifikat valid
      rejectUnauthorized: false // Bypass strict SSL just in case
    };

    if (bodyData) {
      (options.headers as Record<string, string | number>)['Content-Length'] = Buffer.byteLength(bodyData);
    }

    const proxyReq = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        // If Cloudflare returns a Bad Gateway, Argo Tunnel Error (1033), or Unregistered (530), invalidate cache
        if (res.statusCode === 502 || res.statusCode === 503 || res.statusCode === 530 || responseBody.includes('error code: 1033') || responseBody.includes('unregistered from Argo Tunnel')) {
          lastFetchTime = 0; // Force refresh on next request
        }

        try {
          const json = JSON.parse(responseBody);
          resolve(NextResponse.json(json, { status: res.statusCode }));
        } catch (e) {
          resolve(new NextResponse(responseBody, {
            status: res.statusCode,
            headers: { 'Content-Type': res.headers['content-type'] || 'text/plain' }
          }));
        }
      });
    }); 
    
    proxyReq.on('error', (e) => {
      cachedVpsUrl = '';
      lastFetchTime = 0;
      resolve(NextResponse.json({ status: 'error', message: e.message }, { status: 502 }));
    });

    proxyReq.setTimeout(15000, () => {
      proxyReq.destroy(new Error('Proxy request timed out after 15s'));
    });

    if (bodyData) proxyReq.write(bodyData);
    proxyReq.end();
  });
}
