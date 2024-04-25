import pkg, { type Device } from '@rnbo/js';

const { MIDIEvent } = pkg;
import { type Input, WebMidi } from 'webmidi';

export function setupKeyboardMIDI(device: Device, context: AudioContext) {
	const whiteKeyNoteNumbers = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84, 86, 88]; // MIDI note numbers for the white keys starting from C4 (middle C) until C7
	const blackKeyNoteNumbers = [61, 63, 0, 66, 68, 0, 70, 0, 73, 75, 0, 78, 80, 0, 82, 0, 85, 87, 0]; // MIDI note numbers for the black keys (0 indicates no black key)

	// Event listener for key press
	document.addEventListener('keydown', (event) => {
		context.resume();
		const key = event.key.toUpperCase();
		const whiteKeys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\''];
		const blackKeys = ['W', 'E', '', 'T', 'Y', '', 'U', '', 'O', 'P', ''];

		// Check if the pressed key is a white key
		const whiteIndex = whiteKeys.indexOf(key);
		if (whiteIndex !== -1) {
			const mappedNote = whiteKeyNoteNumbers[whiteIndex];
			const midiChannel = 0;
			const velocity = 127; // Maximum velocity for key press
			const noteOnMessage = [144 + midiChannel, mappedNote, velocity];
			const noteOnEvent = new MIDIEvent(device.context.currentTime * 1000, 0, noteOnMessage);
			device.scheduleEvent(noteOnEvent);
		}

		// Check if the pressed key is a black key
		const blackIndex = blackKeys.indexOf(key);
		if (blackIndex !== -1) {
			const mappedNote = blackKeyNoteNumbers[blackIndex];
			if (mappedNote !== 0) { // Skip keys with note number 0 (no black key)
				const midiChannel = 0;
				const velocity = 127; // Maximum velocity for key press
				const noteOnMessage = [144 + midiChannel, mappedNote, velocity];
				const noteOnEvent = new MIDIEvent(device.context.currentTime * 1000, 0, noteOnMessage);
				device.scheduleEvent(noteOnEvent);
			}
		}
	});

	// Event listener for key release
	document.addEventListener('keyup', (event) => {
		const key = event.key.toUpperCase();
		const whiteKeys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\''];
		const blackKeys = ['W', 'E', '', 'T', 'Y', '', 'U', '', 'O', 'P', ''];

		// Check if the released key is a white key
		const whiteIndex = whiteKeys.indexOf(key);
		if (whiteIndex !== -1) {
			const mappedNote = whiteKeyNoteNumbers[whiteIndex];
			const midiChannel = 0;
			const noteOffMessage = [128 + midiChannel, mappedNote, 0];
			const noteOffEvent = new MIDIEvent(device.context.currentTime * 1000, 0, noteOffMessage);
			device.scheduleEvent(noteOffEvent);
		}

		// Check if the released key is a black key
		const blackIndex = blackKeys.indexOf(key);
		if (blackIndex !== -1) {
			const mappedNote = blackKeyNoteNumbers[blackIndex];
			if (mappedNote !== 0) { // Skip keys with note number 0 (no black key)
				const midiChannel = 0;
				const noteOffMessage = [128 + midiChannel, mappedNote, 0];
				const noteOffEvent = new MIDIEvent(device.context.currentTime * 1000, 0, noteOffMessage);
				device.scheduleEvent(noteOffEvent);
			}
		}
	});
}

export function setupExternalMIDI(device: Device, context: AudioContext, inputName: string): Input | null {
	const myInput = WebMidi.getInputByName(inputName);
	if (!myInput) {
		return null;
	}
	myInput.addListener('noteon', (e) => {
		context.resume();
		let midiChannel = 0;
		let note = e.note.number;
		let velocity = e.rawValue;

		// Format a MIDI message payload for a note on event
		let noteOnMessage = [
			144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
			note, // MIDI Note
			velocity // MIDI Velocity
		];

		// Format a MIDI message payload for a note off event
		let noteOffMessage = [
			128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
			note, // MIDI Note
			0 // MIDI Velocity
		];

		let midiPort = 0;
		let noteDurationMs = 250;

		// Schedule the note on event
		// @ts-ignore
		const noteOnEvent = new MIDIEvent(device.context.currentTime * 1000, midiPort, noteOnMessage);
		device.scheduleEvent(noteOnEvent);
	});

	myInput.addListener('noteoff', (e) => {
		let midiChannel = 0;
		let note = e.note.number;

		// Format a MIDI message payload for a note off event
		let noteOffMessage = [
			128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
			note, // MIDI Note
			0 // MIDI Velocity
		];

		let midiPort = 0;

		// Schedule the note off event immediately
		// @ts-ignore
		let noteOffEvent = new MIDIEvent(device.context.currentTime * 1000, midiPort, noteOffMessage);
		device.scheduleEvent(noteOffEvent);
	});

	return myInput;
}

export function removeExternalMIDI(inputName: string) {
	const myInput = WebMidi.getInputByName(inputName);

	myInput!.removeListener('noteon');
	myInput!.removeListener('noteoff');
}

const NOTE_DURATION_MS = 250; // Duration of each note

export function playNote(device: Device, context: AudioContext, note: number) {
	context.resume();
	const midiChannel = 0;
	const velocity = 100; // You can adjust the velocity as needed

	// Format a MIDI message payload for a note on event
	const noteOnMessage = [
		144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
		note, // MIDI Note
		velocity // MIDI Velocity
	];

	// Format a MIDI message payload for a note off event
	const noteOffMessage = [
		128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
		note, // MIDI Note
		0 // MIDI Velocity
	];

	// Schedule the note on event
	const noteOnEvent = new MIDIEvent(device.context.currentTime * 1000, 0, noteOnMessage);
	device.scheduleEvent(noteOnEvent);

	// Schedule the note off event after NOTE_DURATION_MS
	const noteOffEvent = new MIDIEvent((device.context.currentTime + NOTE_DURATION_MS / 1000) * 1000, 0, noteOffMessage);
	device.scheduleEvent(noteOffEvent);
}