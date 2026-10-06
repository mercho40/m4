import type { getCookieCache } from "better-auth/cookies";

type CookieSession = NonNullable<Awaited<ReturnType<typeof getCookieCache>>>;

declare global {
	namespace App {
		interface Locals {
			user: CookieSession["user"] | null;
		}

		// Shape of `page.error`. `status` and `message` are built in; `errorId` is
		// generated in handleError so a user can quote it and it can be matched
		// against the server logs without exposing the underlying error. It is
		// optional because expected errors pass through without one.
		interface Error {
			errorId?: string;
		}
	}
}

export {};
