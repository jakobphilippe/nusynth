import pkg from '@rnbo/js';
const { MIDIEvent } = pkg;
import {WebMidi} from "webmidi";

export function makeSliders(device) {
  let pdiv = document.getElementById("rnbo-parameter-sliders");
  let noParamLabel = document.getElementById("no-param-label");
  // @ts-ignore
  if (noParamLabel && device.numParameters > 0) pdiv.removeChild(noParamLabel);

  // This will allow us to ignore parameter update events while dragging the slider.
  let isDraggingSlider = false;
  let uiElements = {};

  device.parameters.forEach(param => {
    // Subpatchers also have params. If we want to expose top-level
    // params only, the best way to determine if a parameter is top level
    // or not is to exclude parameters with a '/' in them.
    // You can uncomment the following line if you don't want to include subpatcher params

    //if (param.id.includes("/")) return;

    // Create a label, an input slider and a value display
    let label = document.createElement("label");
    let slider = document.createElement("input");
    let text = document.createElement("input");
    let sliderContainer = document.createElement("div");
    sliderContainer.appendChild(label);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(text);

    // Add a name for the label
    label.setAttribute("name", param.name);
    label.setAttribute("for", param.name);
    label.setAttribute("class", "param-label");
    label.textContent = `${param.name}: `;

    // Make each slider reflect its parameter
    slider.setAttribute("type", "range");
    slider.setAttribute("class", "param-slider");
    slider.setAttribute("id", param.id);
    slider.setAttribute("name", param.name);
    slider.setAttribute("min", param.min);
    slider.setAttribute("max", param.max);
    if (param.steps > 1) {    // @ts-ignore
      slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
    } else {    // @ts-ignore
      slider.setAttribute("step", (param.max - param.min) / 1000.0);
    }
    slider.setAttribute("value", param.value);

    // Make a settable text input display for the value
    text.setAttribute("value", param.value.toFixed(1));
    text.setAttribute("type", "text");

    // Make each slider control its parameter
    slider.addEventListener("pointerdown", () => {
      isDraggingSlider = true;
    });
    slider.addEventListener("pointerup", () => {
      isDraggingSlider = false;
      slider.value = param.value;
      text.value = param.value.toFixed(1);
    });
    slider.addEventListener("input", () => {
      let value = Number.parseFloat(slider.value);
      param.value = value;
    });

    // Make the text box input control the parameter value as well
    text.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        let newValue = Number.parseFloat(text.value);
        if (isNaN(newValue)) {
          text.value = param.value;
        } else {
          newValue = Math.min(newValue, param.max);
          newValue = Math.max(newValue, param.min);
          // @ts-ignore
          text.value = newValue;
          param.value = newValue;
        }
      }
    });

    // Store the slider and text by name so we can access them later
    // @ts-ignore
    uiElements[param.id] = { slider, text };

    // Add the slider element
    // @ts-ignore
    pdiv.appendChild(sliderContainer);
  });

  // Listen to parameter changes from the device
  device.parameterChangeEvent.subscribe(param => {
    if (!isDraggingSlider)
      // @ts-ignore
      uiElements[param.id].slider.value = param.value;
    // @ts-ignore
    uiElements[param.id].text.value = param.value.toFixed(1);
  });
}

export function makeMIDIKeyboard(device: Device) {
  let mdiv = document.getElementById("rnbo-clickable-keyboard");
  if (device.numMIDIInputPorts === 0) return;

  // @ts-ignore
  mdiv!.removeChild(document.getElementById("no-midi-label"));

  const midiNotes = [49, 52, 56, 63];
  midiNotes.forEach(note => {
    const key = document.createElement("div");
    const label = document.createElement("p");
    label.textContent = String(note);
    key.appendChild(label);
    key.addEventListener("pointerdown", () => {
      let midiChannel = 0;

      // Format a MIDI message paylaod, this constructs a MIDI on event
      let noteOnMessage = [
        144 + midiChannel, // Code for a note on: 10010000 & midi channel (0-15)
        note, // MIDI Note
        100 // MIDI Velocity
      ];

      let noteOffMessage = [
        128 + midiChannel, // Code for a note off: 10000000 & midi channel (0-15)
        note, // MIDI Note
        0 // MIDI Velocity
      ];

      // Including rnbo.min.js (or the unminified rnbo.js) will add the RNBO object
      // to the global namespace. This includes the TimeNow constant as well as
      // the MIDIEvent constructor.
      let midiPort = 0;
      let noteDurationMs = 250;

      // When scheduling an event to occur in the future, use the current audio context time
      // multiplied by 1000 (converting seconds to milliseconds) for now.
      // @ts-ignore
      let noteOnEvent = new MIDIEvent(device.context.currentTime * 1000, midiPort, noteOnMessage);
      // @ts-ignore
      let noteOffEvent = new MIDIEvent(device.context.currentTime * 1000 + noteDurationMs, midiPort, noteOffMessage);

      device.scheduleEvent(noteOnEvent);
      device.scheduleEvent(noteOffEvent);

      key.classList.add("clicked");
    });

    key.addEventListener("pointerup", () => key.classList.remove("clicked"));
    // @ts-ignore
    mdiv.appendChild(key);
  });
}

export function setupExternalMIDI(device: Device, context: AudioContext) {
  WebMidi
    .enable()
    .then(onEnabled)
    .catch(err => alert(err));

  function onEnabled() {
    const myInput = WebMidi.getInputByName("V49 Out");

    console.log(myInput)

    myInput!.addListener("noteon", e => {
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

    myInput.addListener("noteoff", e => {
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
  }

}

export function darkMode() {
  // On page load or when changing themes, best to add inline in `head` to avoid FOUC
  if (localStorage.snyth_theme === 'dark' || (!('snyth_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

// // Whenever the user explicitly chooses light mode
//   localStorage.theme = 'light'
//
// // Whenever the user explicitly chooses dark mode
//   localStorage.theme = 'dark'
//
// // Whenever the user explicitly chooses to respect the OS preference
//   localStorage.removeItem('theme')
}