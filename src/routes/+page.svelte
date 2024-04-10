<script lang="ts">
	import {setupExternalMIDI} from "$lib/rnboUtils";
	import Oscillators from "$lib/nexus/Oscillators.svelte";
	import ADSR from "$lib/nexus/ADSR.svelte";
	import SelectorLevel from "$lib/nexus/SelectorLevel.svelte";
	import Filter from "$lib/nexus/Filter.svelte";
	import FMSynth from "$lib/nexus/FMSynth.svelte";
	import EffectRack from "$lib/nexus/EffectRack.svelte";
	import pkg from '@rnbo/js';
	const {createDevice} = pkg;
	import { onMount } from 'svelte';
	import { rnboNexus } from '$lib/rnboNexus';

	onMount(() => {
		const patchExportURL = "/kob.export.json";

		const WAContext = window.AudioContext || window.webkitAudioContext;
		const context = new WAContext();

		// Create gain node and connect it to audio output
		const outputNode = context.createGain();
		outputNode.connect(context.destination);

		const compressor = context.createDynamicsCompressor();
		compressor.threshold.setValueAtTime(-50, context.currentTime);
		compressor.knee.setValueAtTime(40, context.currentTime);
		compressor.ratio.setValueAtTime(12, context.currentTime);
		compressor.attack.setValueAtTime(0, context.currentTime);
		compressor.release.setValueAtTime(0.25, context.currentTime);

		const setup = async () => {
			let rawPatcher = await fetch(patchExportURL);
			let patcher = await rawPatcher.json();

			let device = await createDevice({context, patcher});

			device.node.connect(context.destination);
			compressor.connect(context.destination);


			return device;
		};

		setup().then(async (device) => {
			// makeSliders(device)
			await rnboNexus(device, context);
			setupExternalMIDI(device, context);
		});

		document.body.onclick = () => {
			context.resume();
		}
	});
</script>

<div class="p-5 m-auto mt-28 bg-[#D3D6DA] border-4 border-gray-500 rounded shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] w-fit min-w-[1471px] min-h-[676px]">
	<h1 class="text-5xl font-light mt-5 ml-10"><span class="text-[#C8102E] font-bold">NU</span><span
		class="text-black">Synth</span></h1>
	<div>
		<div class="flex flex-row justify-evenly">
			<div class="my-10 ml-10 pl-10 pr-10 rounded-md border-2 border-solid py-5">
				<div class="flex flex-row gap-x-7">
					<Oscillators/>
					<ADSR/>
				</div>
				<div class="mt-5" id="oscilloscope"></div>
			</div>
			<div class="m-10 p-5 rounded-md border-2 border-solid">
				<p class="text-2xl font-bold">Filters</p>
				<Filter id="filter1" label="Filter 1"/>
				<Filter id="filter2" label="Filter 2"/>
				<p class="text-2xl font-bold mt-4">LFOs</p>
				<SelectorLevel ID="lfo1" adj="freq" dest="dest" label="LFO1"/>
				<SelectorLevel ID="lfo2" adj="freq" dest="dest" label="LFO2"/>
			</div>
			<div class="flex flex-col pr-10">
				<FMSynth />
				<EffectRack />
			</div>
		</div>
	</div>
	<!--        <div id="rnbo-clickable-keyboard">-->
	<!--                <h2>MIDI Keyboard</h2>-->
	<!--                <em id="no-midi-label">No MIDI input</em>-->
	<!--            </div>-->
	<!--            <div id="rnbo-root">-->
	<!--                <div id="rnbo-parameter-sliders">-->
	<!--                    <h2>Parameters</h2>-->
	<!--                    <em id="no-param-label">No parameters</em>-->
	<!--                </div>-->
	<!--            </div>-->
</div>