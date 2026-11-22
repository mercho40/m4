// bun .github/scripts/web-deploy-config.ts
//
// Writes apps/web/wrangler.deploy.json: wrangler.jsonc plus the Worker's
// custom domains, which are repository variables rather than lines in
// wrangler.jsonc, because m4 is a template. Deploy runs wrangler with it.
//   WEB_DOMAIN      production's host, e.g. app.example.com. Unset: the
//                   Worker serves only its workers.dev URL.
//   PREVIEW_DOMAIN  previews' parent domain. Adds app.<PREVIEW_DOMAIN>, which
//                   serves Worker Previews (pr-<n>.app.<PREVIEW_DOMAIN>) and
//                   never production traffic.
// It sits beside wrangler.jsonc, whose paths are relative to it; wrangler
// never picks it up on its own.
const dir = new URL("../../apps/web/", import.meta.url);
const config = Bun.JSONC.parse(await Bun.file(new URL("wrangler.jsonc", dir)).text()) as Record<string, unknown>;
const { WEB_DOMAIN, PREVIEW_DOMAIN } = process.env;
const routes = [];
if (WEB_DOMAIN) routes.push({ pattern: WEB_DOMAIN, custom_domain: true });
if (PREVIEW_DOMAIN) {
	routes.push({ pattern: `app.${PREVIEW_DOMAIN}`, custom_domain: true, previews_enabled: true, enabled: false });
}
await Bun.write(new URL("wrangler.deploy.json", dir), JSON.stringify({ ...config, routes }, null, 2));
console.log(`Custom domains: ${routes.map((r) => r.pattern).join(", ") || "none (workers.dev only)"}`);
