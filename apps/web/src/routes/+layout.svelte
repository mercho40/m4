<script lang="ts">
	import "./layout.css";

	let { children } = $props();
</script>

<a
	href="#main-content"
	class="fixed top-2 left-2 z-50 -translate-y-20 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md focus:translate-y-0 focus:ring-2 focus:ring-ring focus:outline-none"
>
	Skip to main content
</a>
{@render children()}
