import type { ParamDialEntry } from '$lib/rnboNexus';

let driftDirection = 1; // Start with an upward drift

export function genParamVal(
	previousValue: number,
	min: number,
	max: number,
	volatility: number,
	driftSwitchChance: number
): number {
	// Randomly switch drift direction
	if (Math.random() < driftSwitchChance) {
		driftDirection *= -1;
	}

	const drift = driftDirection * (max / 100);
	const randomOffset = Math.random() * volatility - volatility / 2;
	let newValue = previousValue + drift + randomOffset;

	// Clamp and scale the value
	return Math.max(min, Math.min(max, newValue));
}

export function initGenParam(param: any, dial: any, running: { current: boolean, timeoutRef?: any }, volatility: number, driftSwitchChance: number, timeout: number) {
    function generateNewValue() {
        if (!running.current) return;  // Stop generating if the flag is false

        const genVal = genParamVal(
            param.value,
            param.min,
            param.max,
            volatility,
            driftSwitchChance
        );

        dial.value = genVal;
        param.value = genVal;

        // Schedule the next update with the specified timeout
        running.timeoutRef = setTimeout(generateNewValue, timeout);
    }

    if (running.timeoutRef) {
        clearTimeout(running.timeoutRef);  // Clear existing timeout if there is one
    }

    generateNewValue();
}


export async function startGen(params: Record<string, ParamDialEntry>, runningFlags: Map<string, { current: boolean, timeoutRef?: any }>, forceRestart: boolean = false, options: { volatility: number, driftSwitchChance: number, timeout: number }) {
    const targetDialNames = new Set([
        'poly/reverb/mix',
        'poly/reverb/size',
        'poly/reverb/diff',
        'poly/reverb/jitter',
        'poly/reverb/damp',
        'poly/reverb/chorus',
        'poly/reverb/feedback',
        'poly/overdrive/mix',
        'poly/overdrive/drive',
        'poly/delay/wet',
        'poly/delay/stereo-delay',
        'poly/delay/feedback',
        'osc1',
        'osc2',
        'osc3',
        'poly/trem/depth',
        'poly/trem/rate',
        'poly/trem/spread',
        'poly/adsr/attack',
        'poly/adsr/delay',
        'poly/adsr/sustain',
        'poly/adsr/release',
        'poly/filter1/q',
        'poly/filter1/freq',
        'poly/filter2/q',
        'poly/filter2/freq',
    ]);
    const promises = Object.entries(params).map(([dialName, entry]) => {
        if (targetDialNames.has(dialName)) {
            let running = runningFlags.get(dialName);
            if (!running || forceRestart) {
                // Initialize or reset the running flag and timeout reference
                running = { current: true, timeoutRef: running?.timeoutRef };
                runningFlags.set(dialName, running);
            } else {
                // Explicitly set current to true when not forcing restart
                running.current = true;
            }
            initGenParam(entry.param, entry.dial, running, options.volatility, options.driftSwitchChance, options.timeout);
        }
    });

    await Promise.all(promises);
}




export function stopGen(dialName: string, runningFlags: Map<string, { current: boolean, timeoutRef?: any }>) {
    const running = runningFlags.get(dialName);
    if (running) {
        running.current = false;
        if (running.timeoutRef) {
            clearTimeout(running.timeoutRef);
            running.timeoutRef = null;
        }
    }
}

export function updateGen(params: Record<string, ParamDialEntry>, runningFlags: Map<string, { current: boolean, timeoutRef?: any }>, options: { volatility: number, driftSwitchChance: number, timeout: number }) {
    Object.entries(params).forEach(([dialName, entry]) => {
        const running = runningFlags.get(dialName);
        if (running && running.current) {
            initGenParam(entry.param, entry.dial, running, options.volatility, options.driftSwitchChance, options.timeout);
        }
    });
}