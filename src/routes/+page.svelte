<script lang="ts">
	import { removeExternalMIDI, setupExternalMIDI, setupKeyboardMIDI } from '$lib/rnboUtils';
	import Oscillators from '$lib/nexus/Oscillators.svelte';
	import ADSR from '$lib/nexus/ADSR.svelte';
	import SelectorLevel from '$lib/nexus/SelectorLevel.svelte';
	import Filter from '$lib/nexus/Filter.svelte';
	import FMSynth from '$lib/nexus/FMSynth.svelte';
	import EffectRack from '$lib/nexus/EffectRack.svelte';
	import pkg, { type Device } from '@rnbo/js';
	import { fade } from 'svelte/transition';

	const { createDevice } = pkg;
	import { onMount } from 'svelte';
	import { rnboNexus } from '$lib/rnboNexus';
	import { Input, WebMidi } from 'webmidi';
	import Tremolo from '$lib/nexus/Tremolo.svelte';
	import Gen from '$lib/nexus/Gen.svelte';

	let rnboDevice: Device;
	let audioContext: AudioContext;
	let currentMIDI: Input | null;
	let isSynthPage: boolean = true;
	let params = {};
	let isVisible = true;

	onMount(() => {
		const patchExportURL = '/kob.export.json';

		const WAContext = window.AudioContext || window.webkitAudioContext;
		const context = new WAContext();
		let selectedParameter = null;

		// Create gain node and connect it to audio output
		const outputNode = context.createGain();
		outputNode.connect(context.destination);

		const compressor = context.createDynamicsCompressor();
		compressor.threshold.setValueAtTime(-0.1, context.currentTime);
		compressor.knee.setValueAtTime(0, context.currentTime);
		compressor.ratio.setValueAtTime(20, context.currentTime);
		compressor.attack.setValueAtTime(0.01, context.currentTime);
		compressor.release.setValueAtTime(0.1, context.currentTime);

		const setup = async () => {
			let rawPatcher = await fetch(patchExportURL);

			let patcher = await rawPatcher.json();

			let device = await createDevice({ context, patcher });

			device.node.connect(context.destination);
			compressor.connect(context.destination);

			rnboDevice = device;
			audioContext = context;

			return [device, patcher];
		};


		setup().then(async (ret) => {
			const device = ret[0];
			const patcher = ret[1];
			// makeSliders(device)
			params = await rnboNexus(device, context, patcher);
			WebMidi.enable().then(() => {
				updateMidiInputs();
				setupKeyboardMIDI(device, context);
				WebMidi.addListener('connected', updateMidiInputs);
				WebMidi.addListener('disconnected', updateMidiInputs);
			});
		});

		document.body.onclick = () => {
			context.resume();
		};

		setTimeout(() => {
			isVisible = false;
		}, 10000);
	});

	let midiInputs: string[] = [];
	let selectedDevice: string | null = null;

	function updateMidiInputs() {
		midiInputs = WebMidi.inputs.map(input => input.name);
	}

	function selectMidiDevice(event: any) {
		if (selectedDevice) {
			removeExternalMIDI(selectedDevice);
		}
		selectedDevice = event.target.value !== 'none' ? event.target.value : null;
		if (selectedDevice) {
			currentMIDI = setupExternalMIDI(rnboDevice, audioContext, selectedDevice);
		}
	}

	function windowKeydown(event: KeyboardEvent) {
		if (event.key == 'q') {
			isSynthPage = !isSynthPage;
		}
	}
</script>

<svelte:window on:keydown={windowKeydown} />

<div
	class="p-5 m-auto mt-20 bg-[#D3D6DA] border-4 border-gray-500 rounded shadow-[rgba(13,_38,_76,_0.19)_0px_9px_20px] w-fit min-w-[1471px] min-h-[676px]"
>
	<h1 class="text-5xl font-light mt-5 ml-10">
		<span class="text-[#C8102E] font-bold">NU</span><span class="text-black">Synth</span>
	</h1>
	<div class="{isSynthPage ? '' : 'hidden'}">
		<div class="flex flex-row justify-evenly">
			<div class="mt-10 mb-10 ml-10 pl-10 pr-10 rounded-md border-2 border-solid py-5">
				<div class="flex flex-row gap-x-7">
					<Oscillators />
					<ADSR />
				</div>
				<div class="mt-5" id="oscilloscope"></div>
			</div>
			<div class="m-10 p-5 rounded-md border-2 border-solid">
				<p class="text-2xl font-bold">Filters</p>
				<Filter id="filter1" label="Filter 1" />
				<Filter id="filter2" label="Filter 2" />
				<p class="text-xl font-bold mt-4">LFOs</p>
				<SelectorLevel ID="lfo1" adj="freq" dest="dest" label="" />
				<div class="pt-4">
					<SelectorLevel ID="lfo2" adj="freq" dest="dest" label="" />
				</div>
				<Tremolo />
			</div>
			<div class="flex flex-col pr-10">
				<FMSynth />
				<EffectRack />
			</div>
		</div>
		<div class="flex flex-row justify-between space-x-4 items-center">
			<Gen />
			<div class="pr-10">
				<select class="bg-[#D3D6DA]" on:change={selectMidiDevice}>
					<option selected value="none">MIDI off</option>
					{#each midiInputs as input}
						<option value={input}>{input}</option>
					{/each}
				</select>
			</div>
		</div>
		<p class="font-light mt-1 ml-10 {isVisible ? '' : 'hide'}" transition:fade={{ duration: 1000 }}>Press Q for more
			info</p>
	</div>
	<div class="{!isSynthPage ? '' : 'hidden'}">
		<div class="mt-3 ml-10 w-[700px]">
			<h1 class="text-xl font-light">
				By Jakob Philippe
			</h1>
			<p class="mt-6">Information</p>
			<p class="mt-3" id="p-font">
				I created NUSynth for my CS + Music Tech degree capstone project at Northeastern.
				<br /><br />
				I've been fascinated by the idea of a browser-based synthesizer, and RNBO by Cycling '74' made
				it surprisingly simple to build one – allowing me to export Max patches to use in JS. I added a
				random-walk gen component to "generate" the sound of the synthesizer when enabled - like a random LFO.
				It's no $600 VST, missing stuff such as preset saving... etc, but it's a quick way to explore and make unique
				sounds
				in the browser!
				<br /><br />
				Thanks to Anthony De Ritis, the prof. of the capstone course.
			</p>
			<p class="mt-6">Instructions</p>
			<p class="mt-3" id="p-font">
				Use keys a & w thru ' & p to use the virtual midi keyboard, or plug in your own and select it from the dropdown
				on the bottom right.
				<br /><br />
				<a class="underline" href="https://github.com/jakobphilippe/nusynth">GitHub</a>
			</p>
		</div>
	</div>
</div>

<style>
    .hide {
        opacity: 0;
    }
</style>
