<script>
	import SelectorLevel from './SelectorLevel.svelte';
</script>

<div>
	<p class="text-2xl font-bold">Oscillators</p>
	<SelectorLevel label="OSC 1" dest="waveform" adj="level" ID="osc1" />
	<SelectorLevel label="OSC 2" dest="waveform" adj="level" ID="osc2" />
	<SelectorLevel label="OSC 3" dest="waveform" adj="level" ID="osc3" />
</div>
