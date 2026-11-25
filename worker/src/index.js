// Serves the site's videos and posters from the R2 bucket `exclusive-construction-group`.
// Handles Range requests (browsers fetch video in parts) and caches at Cloudflare's edge.
// Files live under videos/v1/{desktop,mobile,poster}/ and never change in place
// (a new version goes under v2/), so they're cached for a year.

const ALLOWED = /^videos\/v\d+\/(desktop|mobile|poster)\/[a-z0-9-]+\.(mp4|jpg)$/;

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!ALLOWED.test(key)) return new Response('Not found', { status: 404 });

    const range = request.headers.get('range');

    // Whole-file requests go through the edge cache. Range requests are served
    // straight from R2 (cheap reads; the Cache API can't store partial responses).
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    if (!range) {
      const hit = await cache.match(cacheKey);
      if (hit) return request.method === 'HEAD' ? new Response(null, hit) : hit;
    }

    const object = await env.MEDIA.get(key, {
      range: range ? request.headers : undefined,
      onlyIf: request.headers,
    });
    if (object === null) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('accept-ranges', 'bytes');
    headers.set('access-control-allow-origin', '*');
    headers.set('timing-allow-origin', '*');
    if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=31536000, immutable');

    // Conditional request matched (If-None-Match etc.): no body.
    if (!('body' in object)) return new Response(null, { status: 304, headers });

    if (range && object.range) {
      const { offset = 0, length = object.size - offset } = object.range;
      headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
      headers.set('content-length', String(length));
      return new Response(request.method === 'HEAD' ? null : object.body, { status: 206, headers });
    }

    headers.set('content-length', String(object.size));
    const response = new Response(object.body, { status: 200, headers });
    if (request.method === 'HEAD') return new Response(null, response);
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
