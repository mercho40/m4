<script lang="ts">
	import "./layout.css";
	import { ModeWatcher } from "mode-watcher";

	let { children } = $props();
</script>

<a
	href="#main-content"
	class="bg-background text-foreground focus:ring-ring fixed top-2 left-2 z-50 -translate-y-20 rounded-md px-3 py-2 text-sm font-medium shadow-md focus:translate-y-0 focus:ring-2 focus:outline-none"
>
	Skip to main content
</a>
<ModeWatcher />
{@render children()}
