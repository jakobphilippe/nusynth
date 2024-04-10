<script lang="ts">
	export let id;
	export let label;
</script>

<p class="text-xl mt-2">{label}</p>
<div class="flex flex-row space-x-4">
	<div class="flex-col">
		<div id="poly/{id}/type"></div>
		<p class="text-sm uppercase">Type</p>
	</div>
	<div class="flex-col text-center items-center">
		<div id="poly/{id}/freq"></div>
		<p class="text-sm uppercase">FRQ</p>
	</div>
	<div class="flex-col text-center items-center">
		<div id="poly/{id}/q"></div>
		<p class="text-sm uppercase">Q</p>
	</div>
</div>
