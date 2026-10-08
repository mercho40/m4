import type { RequestEvent } from "@sveltejs/kit";
import { BETTER_AUTH_SECRET } from "$app/env/private";

// Must match apps/back/src/lib/client-ip.ts, which explains why the API needs
// them: these server-to-server calls would otherwise all rate-limit as one IP.
const CLIENT_IP_HEADER = "x-m4-client-ip";
const CLIENT_IP_SIGNATURE_HEADER = "x-m4-client-ip-signature";

// Imported on first use: the secret is only required at runtime, and an empty
// HMAC key would throw during the build.
let key: Promise<CryptoKey> | undefined;

/**
 * Headers that tell Better Auth who the request is really from: the browser's
 * user agent, recorded on the session, and its IP, HMAC-signed so the API can
 * trust it for rate limiting. Spread into every server-side call to the API.
 */
export async function clientHeaders(event: RequestEvent): Promise<Record<string, string>> {
	const headers: Record<string, string> = {};
	const userAgent = event.request.headers.get("user-agent");
	if (userAgent) headers["user-agent"] = userAgent;

	let ip: string;
	try {
		ip = event.getClientAddress();
	} catch {
		return headers;
	}

	key ??= crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(BETTER_AUTH_SECRET),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign("HMAC", await key, new TextEncoder().encode(`m4-client-ip:${ip}`));

	headers[CLIENT_IP_HEADER] = ip;
	headers[CLIENT_IP_SIGNATURE_HEADER] = Array.from(new Uint8Array(signature), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
	return headers;
}
