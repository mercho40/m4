<script lang="ts">
	import { authClient } from "$lib/auth-client";
	import SunIcon from "@lucide/svelte/icons/sun";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import { toggleMode } from "mode-watcher";
	import { Button } from "$lib/components/ui/button/index.js";

	let { data } = $props();
</script>

<h1>Welcome to Fleni</h1>
<div>
	{#if data.user}
		<div>
			<p>{data.user.name}</p>
			<a href="/dashboard">Dashboard</a>
			<button
				onclick={async () => {
					await authClient.signOut();
					window.location.href = "/";
				}}
			>
				Sign Out
			</button>
		</div>
	{:else}
		<a href="/login">Login</a>
	{/if}
</div>
<Button onclick={toggleMode} variant="outline" size="icon">
	<SunIcon
		class="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 !transition-all dark:scale-0 dark:-rotate-90"
	/>
	<MoonIcon
		class="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 !transition-all dark:scale-100 dark:rotate-0"
	/>
	<span class="sr-only">Toggle theme</span>
</Button>
