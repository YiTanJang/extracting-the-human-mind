import type { NextRequest } from "next/server";

// Same-origin proxy to the FastAPI service. The API is reachable only inside the cluster
// (deploy/k8s); the browser talks to /api/* on this origin, so the session cookie stays first-party.
const FORWARD_REQUEST_HEADERS = ["content-type", "cookie", "authorization", "accept"];
const DROP_RESPONSE_HEADERS = new Set(["content-encoding", "content-length", "transfer-encoding", "connection", "set-cookie"]);

async function proxy(request: NextRequest, ctx: RouteContext<"/api/[...path]">) {
  const base = process.env.API_INTERNAL_URL ?? "http://localhost:8000";
  const { path } = await ctx.params;
  const target = `${base}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  // Cloudflare Tunnel sets cf-connecting-ip; the API rate-limits code attempts per client.
  const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json({ detail: "api_unreachable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, name) => {
    if (!DROP_RESPONSE_HEADERS.has(name)) responseHeaders.set(name, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);
  responseHeaders.set("cache-control", "no-store");

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
