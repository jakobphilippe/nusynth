<script lang="ts">
	export let ID;
	export let dest;
	export let adj;
	export let label;
</script>

{#if label !== ""}
<p class="text-xl mt-2">{label}</p>
{/if}
<div class="flex flex-row space-x-4 items-center">
	<div id="poly/{ID}/{dest}"></div>
	<div id="poly/{ID}/{adj}"></div>
	<div id="poly/{ID}/number"></div>
</div>
