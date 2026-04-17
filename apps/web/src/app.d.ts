declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				name: string;
				email: string;
				emailVerified: boolean;
				image?: string | null;
				createdAt: Date;
				updatedAt: Date;
			} | null;
			session: {
				id: string;
				expiresAt: Date;
				token: string;
				userId: string;
			} | null;
		}
	}
}

export {};
