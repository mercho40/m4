import { BETTER_AUTH_SECRET } from "#back/lib/env.js";

// Sign-in, sign-up, sign-out and session revalidation reach this API from the
// web app's server, not the browser, so Better Auth's per-IP rate limiter
// would see Vercel's egress address for every user and lock them all out
// together (3 sign-ins per 10s, site-wide). Forwarding the client IP in
// X-Forwarded-For cannot fix it: Haloy's proxy (Go's ReverseProxy with
// SetXForwarded) discards any inbound value and sets the TCP peer instead.
// So the web app sends the address in its own header, HMAC-signed with the
// secret both apps already share, and only a valid signature is honoured.
export const CLIENT_IP_HEADER = "x-m4-client-ip";
export const CLIENT_IP_SIGNATURE_HEADER = "x-m4-client-ip-signature";

const key = crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(BETTER_AUTH_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["verify"],
);

/**
 * Replace X-Forwarded-For with the web app's signed client IP, when there is
 * one. The custom headers are always removed, so a forged pair is dropped and
 * the request keeps the peer address Haloy set.
 */
export async function applyClientIp(request: Request): Promise<Request> {
  const ip = request.headers.get(CLIENT_IP_HEADER);
  const signature = request.headers.get(CLIENT_IP_SIGNATURE_HEADER);
  request.headers.delete(CLIENT_IP_HEADER);
  request.headers.delete(CLIENT_IP_SIGNATURE_HEADER);

  if (ip && signature && /^[0-9a-f]{64}$/.test(signature)) {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key,
      Buffer.from(signature, "hex"),
      // Prefixed so the signature cannot be replayed as any other HMAC this
      // secret produces.
      new TextEncoder().encode(`m4-client-ip:${ip}`),
    );
    if (valid) request.headers.set("x-forwarded-for", ip);
  }

  return request;
}
