// Initialize AudioContext
let audioContext;

// Create oscillators, gain nodes, envelope, and filter for each synth
const synths = [
    { oscillator: null, gainNode: null, envelope: null, filter: null, sequencer: null },
    { oscillator: null, gainNode: null, envelope: null, filter: null, sequencer: null },
    { oscillator: null, gainNode: null, envelope: null, filter: null, sequencer: null }
];

// Initialize AudioContext when the page loads
document.addEventListener('DOMContentLoaded', () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Set up event listeners for play buttons
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('mousedown', () => startSynth(button.dataset.synth));
        button.addEventListener('mouseup', () => stopSynth(button.dataset.synth));
        button.addEventListener('mouseleave', () => stopSynth(button.dataset.synth));
    });

    // Set up event listeners for frequency sliders
    const frequencySliders = document.querySelectorAll('input[id^="frequency"]');
    frequencySliders.forEach(slider => {
        slider.addEventListener('input', updateFrequency);
    });

    // Set up event listeners for waveform selects
    const waveformSelects = document.querySelectorAll('select[id^="waveform"]');
    waveformSelects.forEach(select => {
        select.addEventListener('change', updateWaveform);
    });

    // Set up event listeners for envelope controls
    const envelopeControls = document.querySelectorAll('input[id^="attack"], input[id^="decay"], input[id^="sustain"], input[id^="release"]');
    envelopeControls.forEach(control => {
        control.addEventListener('input', updateEnvelope);
    });

    // Set up event listeners for filter controls
    const filterControls = document.querySelectorAll('input[id^="filterFreq"], input[id^="filterQ"]');
    filterControls.forEach(control => {
        control.addEventListener('input', updateFilter);
    });

    // Set up event listeners for save preset buttons
    const savePresetButtons = document.querySelectorAll('.save-preset');
    savePresetButtons.forEach(button => {
        button.addEventListener('click', savePreset);
    });

    // Set up event listeners for load preset buttons
    const loadPresetButtons = document.querySelectorAll('.load-preset');
    loadPresetButtons.forEach(button => {
        button.addEventListener('click', loadPreset);
    });

    // Set up event listeners for play sequence buttons
    const playSequenceButtons = document.querySelectorAll('.play-sequence');
    playSequenceButtons.forEach(button => {
        button.addEventListener('click', playSequence);
    });

    // Set up event listeners for stop sequence buttons
    const stopSequenceButtons = document.querySelectorAll('.stop-sequence');
    stopSequenceButtons.forEach(button => {
        button.addEventListener('click', stopSequence);
    });

    // Set up event listeners for tempo sliders
    const tempoSliders = document.querySelectorAll('input[id^="tempo"]');
    tempoSliders.forEach(slider => {
        slider.addEventListener('input', updateTempo);
    });

    // Load existing presets
    loadExistingPresets();
});

function startSynth(synthIndex) {
    const index = parseInt(synthIndex) - 1;
    const synth = synths[index];

    if (synth.oscillator === null) {
        // Create and configure oscillator
        synth.oscillator = audioContext.createOscillator();
        synth.gainNode = audioContext.createGain();
        synth.filter = audioContext.createBiquadFilter();
        synth.envelope = createEnvelope();

        // Connect nodes: oscillator -> envelope -> filter -> gain -> destination
        synth.oscillator.connect(synth.envelope);
        synth.envelope.connect(synth.filter);
        synth.filter.connect(synth.gainNode);
        synth.gainNode.connect(audioContext.destination);

        // Set initial frequency and waveform
        const frequencyInput = document.getElementById(`frequency${synthIndex}`);
        synth.oscillator.frequency.setValueAtTime(frequencyInput.value, audioContext.currentTime);

        const waveformSelect = document.getElementById(`waveform${synthIndex}`);
        synth.oscillator.type = waveformSelect.value;

        // Set initial filter values
        const filterFreqInput = document.getElementById(`filterFreq${synthIndex}`);
        const filterQInput = document.getElementById(`filterQ${synthIndex}`);
        synth.filter.type = 'lowpass';
        synth.filter.frequency.setValueAtTime(filterFreqInput.value, audioContext.currentTime);
        synth.filter.Q.setValueAtTime(filterQInput.value, audioContext.currentTime);

        // Start the oscillator and trigger the envelope
        synth.oscillator.start();
        triggerEnvelope(synth.envelope, synthIndex);
    }
}

function stopSynth(synthIndex) {
    const index = parseInt(synthIndex) - 1;
    const synth = synths[index];

    if (synth.oscillator !== null) {
        releaseEnvelope(synth.envelope, synthIndex);
    }
}

function createEnvelope() {
    const envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0, audioContext.currentTime);
    return envelope;
}

function triggerEnvelope(envelope, synthIndex) {
    const attackTime = parseFloat(document.getElementById(`attack${synthIndex}`).value);
    const decayTime = parseFloat(document.getElementById(`decay${synthIndex}`).value);
    const sustainLevel = parseFloat(document.getElementById(`sustain${synthIndex}`).value);

    const now = audioContext.currentTime;
    envelope.gain.cancelScheduledValues(now);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + attackTime);
    envelope.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
}

function releaseEnvelope(envelope, synthIndex) {
    const releaseTime = parseFloat(document.getElementById(`release${synthIndex}`).value);

    const now = audioContext.currentTime;
    envelope.gain.cancelScheduledValues(now);
    envelope.gain.setValueAtTime(envelope.gain.value, now);
    envelope.gain.linearRampToValueAtTime(0, now + releaseTime);

    // Stop and disconnect oscillator after release
    setTimeout(() => {
        const index = parseInt(synthIndex) - 1;
        const synth = synths[index];
        if (synth.oscillator) {
            synth.oscillator.stop();
            synth.oscillator.disconnect();
            synth.gainNode.disconnect();
            synth.filter.disconnect();
            synth.envelope.disconnect();
            synth.oscillator = null;
            synth.gainNode = null;
            synth.filter = null;
            synth.envelope = null;
        }
    }, releaseTime * 1000);
}

function updateFrequency(event) {
    const synthIndex = event.target.id.slice(-1);
    const frequency = event.target.value;
    const synth = synths[parseInt(synthIndex) - 1];

    if (synth.oscillator) {
        synth.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    }

    // Update the frequency value display
    const frequencyValueSpan = document.getElementById(`frequency${synthIndex}-value`);
    frequencyValueSpan.textContent = `${frequency} Hz`;
}

function updateWaveform(event) {
    const synthIndex = event.target.id.slice(-1);
    const waveform = event.target.value;
    const synth = synths[parseInt(synthIndex) - 1];

    if (synth.oscillator) {
        synth.oscillator.type = waveform;
    }
}

function updateEnvelope(event) {
    const synthIndex = event.target.id.slice(-1);
    const parameter = event.target.id.match(/^([a-z]+)/)[1];
    const value = parseFloat(event.target.value);

    // Update the envelope parameter value display
    const valueSpan = document.getElementById(`${parameter}${synthIndex}-value`);
    valueSpan.textContent = parameter === 'sustain' ? value.toFixed(2) : `${value.toFixed(2)}s`;
}

function updateFilter(event) {
    const synthIndex = event.target.id.slice(-1);
    const parameter = event.target.id.includes('Freq') ? 'frequency' : 'Q';
    const value = parseFloat(event.target.value);
    const synth = synths[parseInt(synthIndex) - 1];

    if (synth.filter) {
        synth.filter[parameter].setValueAtTime(value, audioContext.currentTime);
    }

    // Update the filter parameter value display
    const valueSpan = document.getElementById(`${event.target.id}-value`);
    valueSpan.textContent = parameter === 'frequency' ? `${value} Hz` : value.toFixed(1);
}

function playSequence(event) {
    const synthIndex = event.target.dataset.synth;
    const index = parseInt(synthIndex) - 1;
    const synth = synths[index];

    if (synth.sequencer) {
        stopSequence({ target: { dataset: { synth: synthIndex } } });
    }

    const steps = document.querySelectorAll(`#sequence-grid${synthIndex} input[type="checkbox"]`);
    const tempo = document.getElementById(`tempo${synthIndex}`).value;
    const stepDuration = 60 / tempo / 2; // 16th notes

    synth.sequencer = setInterval(() => {
        steps.forEach((step, i) => {
            if (step.checked) {
                setTimeout(() => {
                    startSynth(synthIndex);
                    setTimeout(() => stopSynth(synthIndex), stepDuration * 1000 * 0.9);
                }, i * stepDuration * 1000);
            }
        });
    }, steps.length * stepDuration * 1000);
}

function stopSequence(event) {
    const synthIndex = event.target.dataset.synth;
    const index = parseInt(synthIndex) - 1;
    const synth = synths[index];

    if (synth.sequencer) {
        clearInterval(synth.sequencer);
        synth.sequencer = null;
    }
}

function updateTempo(event) {
    const synthIndex = event.target.id.slice(-1);
    const tempo = event.target.value;
    const tempoValueSpan = document.getElementById(`tempo${synthIndex}-value`);
    tempoValueSpan.textContent = `${tempo} BPM`;

    // If the sequence is currently playing, restart it with the new tempo
    const playSequenceButton = document.querySelector(`.play-sequence[data-synth="${synthIndex}"]`);
    const stopSequenceButton = document.querySelector(`.stop-sequence[data-synth="${synthIndex}"]`);
    
    if (synths[parseInt(synthIndex) - 1].sequencer) {
        stopSequence({ target: stopSequenceButton });
        playSequence({ target: playSequenceButton });
    }
}

function savePreset(event) {
    const synthIndex = event.target.dataset.synth;
    const presetName = document.getElementById(`preset-name${synthIndex}`).value.trim();

    if (presetName === '') {
        alert('Please enter a preset name');
        return;
    }

    const preset = {
        frequency: document.getElementById(`frequency${synthIndex}`).value,
        waveform: document.getElementById(`waveform${synthIndex}`).value,
        attack: document.getElementById(`attack${synthIndex}`).value,
        decay: document.getElementById(`decay${synthIndex}`).value,
        sustain: document.getElementById(`sustain${synthIndex}`).value,
        release: document.getElementById(`release${synthIndex}`).value,
        filterFreq: document.getElementById(`filterFreq${synthIndex}`).value,
        filterQ: document.getElementById(`filterQ${synthIndex}`).value,
        tempo: document.getElementById(`tempo${synthIndex}`).value,
        sequence: Array.from(document.querySelectorAll(`#sequence-grid${synthIndex} input[type="checkbox"]`)).map(step => step.checked)
    };

    // Save preset to localStorage
    const presets = JSON.parse(localStorage.getItem(`synth${synthIndex}Presets`) || '{}');
    presets[presetName] = preset;
    localStorage.setItem(`synth${synthIndex}Presets`, JSON.stringify(presets));

    // Update preset select options
    updatePresetOptions(synthIndex);

    alert(`Preset "${presetName}" saved successfully`);
}

function loadPreset(event) {
    const synthIndex = event.target.dataset.synth;
    const presetSelect = document.getElementById(`preset-select${synthIndex}`);
    const selectedPreset = presetSelect.value;

    if (selectedPreset === '') {
        alert('Please select a preset to load');
        return;
    }

    const presets = JSON.parse(localStorage.getItem(`synth${synthIndex}Presets`) || '{}');
    const preset = presets[selectedPreset];

    if (preset) {
        // Apply preset values to synth controls
        document.getElementById(`frequency${synthIndex}`).value = preset.frequency;
        document.getElementById(`waveform${synthIndex}`).value = preset.waveform;
        document.getElementById(`attack${synthIndex}`).value = preset.attack;
        document.getElementById(`decay${synthIndex}`).value = preset.decay;
        document.getElementById(`sustain${synthIndex}`).value = preset.sustain;
        document.getElementById(`release${synthIndex}`).value = preset.release;
        document.getElementById(`filterFreq${synthIndex}`).value = preset.filterFreq;
        document.getElementById(`filterQ${synthIndex}`).value = preset.filterQ;
        document.getElementById(`tempo${synthIndex}`).value = preset.tempo;

        // Load sequence
        const steps = document.querySelectorAll(`#sequence-grid${synthIndex} input[type="checkbox"]`);
        steps.forEach((step, i) => {
            step.checked = preset.sequence[i];
        });

        // Update displays and synth parameters
        updateFrequency({ target: document.getElementById(`frequency${synthIndex}`) });
        updateWaveform({ target: document.getElementById(`waveform${synthIndex}`) });
        updateEnvelope({ target: document.getElementById(`attack${synthIndex}`) });
        updateEnvelope({ target: document.getElementById(`decay${synthIndex}`) });
        updateEnvelope({ target: document.getElementById(`sustain${synthIndex}`) });
        updateEnvelope({ target: document.getElementById(`release${synthIndex}`) });
        updateFilter({ target: document.getElementById(`filterFreq${synthIndex}`) });
        updateFilter({ target: document.getElementById(`filterQ${synthIndex}`) });
        updateTempo({ target: document.getElementById(`tempo${synthIndex}`) });

        alert(`Preset "${selectedPreset}" loaded successfully`);
    }
}

function updatePresetOptions(synthIndex) {
    const presetSelect = document.getElementById(`preset-select${synthIndex}`);
    const presets = JSON.parse(localStorage.getItem(`synth${synthIndex}Presets`) || '{}');

    // Clear existing options
    presetSelect.innerHTML = '<option value="">Select Preset</option>';

    // Add options for each preset
    Object.keys(presets).forEach(presetName => {
        const option = document.createElement('option');
        option.value = presetName;
        option.textContent = presetName;
        presetSelect.appendChild(option);
    });
}

function loadExistingPresets() {
    for (let i = 1; i <= 3; i++) {
        updatePresetOptions(i);
    }
}
