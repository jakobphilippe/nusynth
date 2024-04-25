import type { Device } from '@rnbo/js';
import { playNote } from '$lib/rnboUtils';
import { startGen, stopGen, updateGen } from '$lib/gen';

export interface Param {
	min: number;
	max: number;
	value: number;
}

export interface ParamDialEntry {
	param: Param;
	dial: any;
}

export async function rnboNexus(device: Device, context: AudioContext, patcher: any): Promise<Record<string, ParamDialEntry>> {
	// @ts-expect-error
	const Nexus = await import('nexusui');
	const paramMap: Record<string, ParamDialEntry> = {};
	// Oscillators
	const FILL = '#D3D6DA';
	const ACCENT = '#143642';
	const VISIBLE_FILL = '#DEE0E3';
	const START_MIDI_KEY = 60;

	const oscilloscope = new Nexus.Oscilloscope('#oscilloscope', {
		size: [388, 170]
	});

	oscilloscope.colorize('fill', FILL);
	oscilloscope.colorize('accent', ACCENT);
	oscilloscope.connect(device.node);

	const spectrogram = new Nexus.Spectrogram('#spectrogram', {
		size: [175, 100]
	});

	spectrogram.colorize('fill', FILL);
	spectrogram.colorize('accent', ACCENT);
	spectrogram.connect(device.node);

	const oscIDs = ['osc1', 'osc2', 'osc3'];

	oscIDs.forEach((osc) => {
		const waveformParam = device.parametersById.get(`poly/${osc}/waveform`);
		const oscWaveformSelect = new Nexus.Select(`poly/${osc}/waveform`, {
			size: [100, 35],
			options: ['Off', 'Sin', 'Saw', 'Square', 'Noise']
		});

		oscWaveformSelect.colorize('fill', FILL);
		oscWaveformSelect.colorize('accent', ACCENT);

		oscWaveformSelect.selectedIndex = waveformParam.value;

		oscWaveformSelect.on('change', (v: any) => {
			waveformParam.value = v.index;
		});

		const levelParam = device.parametersById.get(`poly/${osc}/level`);
		const oscLevel = new Nexus.Dial(`#poly/${osc}/level`, {
			size: [35, 35],
			interaction: 'radial', // "radial", "vertical", or "horizontal"
			mode: 'relative', // "absolute" or "relative"
			min: levelParam.min,
			max: levelParam.max,
			step: 0.01,
			value: levelParam.value
		});

		paramMap[osc] = { param: levelParam, dial: oscLevel };

		oscLevel.colorize('fill', VISIBLE_FILL);
		oscLevel.colorize('accent', ACCENT);

		oscLevel.on('change', (v: any) => {
			levelParam.value = v;
		});
	});

	// ADSR

	const adsrIDs = ['attack', 'delay', 'sustain', 'release'];

	adsrIDs.forEach((adsr) => {
		const adsrParam = device.parametersById.get(`poly/adsr/${adsr}`);
		const adsrSlider = new Nexus.Slider(`poly/adsr/${adsr}`, {
			size: [125, 20],
			mode: 'relative', // 'relative' or 'absolute'
			min: adsrParam.min,
			max: adsrParam.max,
			step: 0,
			value: adsrParam.initialValue
		});

		paramMap[`poly/adsr/${adsr}`] = { param: adsrParam, dial: adsrSlider };

		adsrSlider.colorize('fill', VISIBLE_FILL);
		adsrSlider.colorize('accent', ACCENT);

		const number = new Nexus.Number(`#poly/adsr/${adsr}/number`);
		number.link(adsrSlider);

		number.colorize('fill', VISIBLE_FILL);
		number.colorize('accent', ACCENT);

		adsrSlider.on('change', (v: any) => {
			adsrParam.value = v;
		});
	});

	// LFOs

	const lfoIDs = ['lfo1', 'lfo2'];

	lfoIDs.forEach((lfo) => {
		const lfoSend = device.parametersById.get(`poly/${lfo}/dest`);
		const lfoSendSelect = new Nexus.Select(`poly/${lfo}/dest`, {
			size: [125, 35],
			options: ['Off', 'OSC Freq', 'Filter 1', 'Filter 2']
		});

		lfoSendSelect.selectedIndex = lfoSend.value;

		lfoSendSelect.on('change', (v: any) => {
			lfoSend.value = v.index;
		});

		lfoSendSelect.colorize('fill', FILL);
		lfoSendSelect.colorize('accent', ACCENT);

		const levelParam = device.parametersById.get(`poly/${lfo}/freq`);
		const oscLevel = new Nexus.Dial(`#poly/${lfo}/freq`, {
			size: [35, 35],
			interaction: 'radial', // "radial", "vertical", or "horizontal"
			mode: 'relative', // "absolute" or "relative"
			min: levelParam.min,
			max: levelParam.max,
			step: 0.1,
			value: levelParam.value
		});

		oscLevel.colorize('fill', VISIBLE_FILL);
		oscLevel.colorize('accent', ACCENT);

		const number = new Nexus.Number(`#poly/${lfo}/number`, {
			size: [40, 25]
		});
		number.link(oscLevel);

		oscLevel.on('change', (v: any) => {
			levelParam.value = v;
		});

		number.colorize('fill', VISIBLE_FILL);
		number.colorize('accent', ACCENT);
	});

	// Filters

	const filterIDs = ['filter1', 'filter2'];

	filterIDs.forEach((filter) => {
		const filterTypeParam = device.parametersById.get(`poly/${filter}/type`);
		const filterTypeSelect = new Nexus.Select(`poly/${filter}/type`, {
			size: [135, 35],
			options: ['Off', 'Low-pass', 'High-pass', 'Bandpass', 'Notch']
		});

		filterTypeSelect.selectedIndex = filterTypeParam.value;

		filterTypeSelect.on('change', (v: any) => {
			filterTypeParam.value = v.index;
		});

		filterTypeSelect.colorize('fill', FILL);
		filterTypeSelect.colorize('accent', ACCENT);

		const freqParam = device.parametersById.get(`poly/${filter}/freq`);
		const freqDial = new Nexus.Dial(`#poly/${filter}/freq`, {
			size: [35, 35],
			interaction: 'radial', // "radial", "vertical", or "horizontal"
			mode: 'relative', // "absolute" or "relative"
			min: freqParam.min,
			max: freqParam.max,
			step: 0.1,
			value: freqParam.value
		});

		paramMap[`poly/${filter}/freq`] = { param: freqParam, dial: freqDial };

		freqDial.colorize('fill', VISIBLE_FILL);
		freqDial.colorize('accent', ACCENT);

		freqDial.on('change', (v: any) => {
			freqParam.value = v;
		});

		const qParam = device.parametersById.get(`poly/${filter}/q`);
		const qDial = new Nexus.Dial(`#poly/${filter}/q`, {
			size: [35, 35],
			interaction: 'radial', // "radial", "vertical", or "horizontal"
			mode: 'relative', // "absolute" or "relative"
			min: qParam.min,
			max: qParam.max,
			step: 0.01,
			value: qParam.value
		});

		paramMap[`poly/${filter}/q`] = { param: qParam, dial: qDial };

		qDial.colorize('fill', VISIBLE_FILL);
		qDial.colorize('accent', ACCENT);

		qDial.on('change', (v: any) => {
			qParam.value = v;
		});
	});

	const fmControl = device.parametersById.get(`poly/fm/fm`);
	const fmControlToggle = new Nexus.Toggle(`poly/fm/fm`, {
		size: [35, 35],
		state: false
	});

	fmControlToggle.on('change', (v: any) => {
		if (v) {
			fmControl.value = 0;
		} else {
			fmControl.value = 1;
		}
	});

	fmControlToggle.colorize('fill', VISIBLE_FILL);
	fmControlToggle.colorize('accent', ACCENT);

	const otherDials = [
		'poly/fm/freq',
		'poly/fm/index',
		'poly/fm/level',
		'poly/delay/wet',
		'poly/delay/feedback',
		'poly/delay/time',
		'poly/delay/stereo-delay',
		'poly/overdrive/drive',
		'poly/overdrive/volume',
		'poly/overdrive/mix',
		'poly/reverb/mix',
		'poly/reverb/size',
		'poly/reverb/diff',
		'poly/reverb/jitter',
		'poly/reverb/damp',
		'poly/reverb/chorus',
		'poly/reverb/feedback',
		'poly/reverb/pitch',
		'poly/reverb/decay',
		'poly/trem/depth',
		'poly/trem/rate',
		'poly/trem/spread'
	];

	otherDials.forEach((dial) => {
		const param = device.parametersById.get(dial);
		const paramDial = new Nexus.Dial(`#${dial}`, {
			size: [35, 35],
			interaction: 'radial', // "radial", "vertical", or "horizontal"
			mode: 'relative', // "absolute" or "relative"
			min: param.min || 0,
			max: param.max,
			step: 0.01,
			value: param.value
		});

		paramDial.colorize('fill', VISIBLE_FILL);
		paramDial.colorize('accent', ACCENT);

		paramDial.on('change', (v: any) => {
			param.value = v;
		});

		paramMap[dial] = { param, dial: paramDial };
	});

	const genVolatility = new Nexus.Dial('#genVolatility', {
		'size': [35, 35],
		'min': 0,
		'max': .1,
		'step': 0.001,
		'value': 0.02
	});

	genVolatility.colorize('fill', VISIBLE_FILL);
	genVolatility.colorize('accent', ACCENT);

	function debounce(func: any, wait: any) {
		let timeout: any;
		return function(...args: any) {
			const context = this;
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(context, args), wait);
		};
	}

	// Apply debouncing to the updateGen function
	const debouncedUpdateGen = debounce((paramMap: any, runningFlags: any, options: any) => {
		if (genToggle.state) { // Check if the generator should be running
			updateGen(paramMap, runningFlags, options);
		}
	}, 200); // Debounce for 200 milliseconds

	genVolatility.on('change', () => {
		debouncedUpdateGen(paramMap, runningFlags, {
			volatility: genVolatility.value,
			timeout: genTimeout.value,
			driftSwitchChance: genChance.value
		});
	});

	const genChance = new Nexus.Dial('#genChance', {
		'size': [35, 35],
		'min': 0,
		'max': 1,
		'step': .01,
		'value': .1
	});

	genChance.colorize('fill', VISIBLE_FILL);
	genChance.colorize('accent', ACCENT);

	genChance.on('change', () => {
		debouncedUpdateGen(paramMap, runningFlags, {
			volatility: genVolatility.value,
			timeout: genTimeout.value,
			driftSwitchChance: genChance.value
		});
	});

	const genTimeout = new Nexus.Dial('#genTimeout', {
		'size': [35, 35],
		'min': 25,
		'max': 250,
		'step': 5,
		'value': 50
	});

	genTimeout.colorize('fill', VISIBLE_FILL);
	genTimeout.colorize('accent', ACCENT);

	genTimeout.on('change', () => {
		debouncedUpdateGen(paramMap, runningFlags, {
			volatility: genVolatility.value,
			timeout: genTimeout.value,
			driftSwitchChance: genChance.value
		});
	});

	const genToggle = new Nexus.Toggle('#genToggle');
	genToggle.colorize('fill', VISIBLE_FILL);
	genToggle.colorize('accent', ACCENT);

	let runningFlags = new Map<string, { current: boolean }>();

	genToggle.on('change', (v: boolean) => {
		if (v) {
			startGen(paramMap, runningFlags, false, { // No need to force restart unless absolutely necessary
				volatility: genVolatility.value,
				timeout: genTimeout.value,
				driftSwitchChance: genChance.value
			});
		} else {
			runningFlags.forEach((flag, dialName) => stopGen(dialName, runningFlags));
		}
	});

	return paramMap;
}
