// Initialize AudioContext
let audioContext;

// Create oscillators and gain nodes for each synth
const synths = [
    { oscillator: null, gainNode: null },
    { oscillator: null, gainNode: null },
    { oscillator: null, gainNode: null }
];

// Initialize AudioContext when the page loads
document.addEventListener('DOMContentLoaded', () => {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Set up event listeners for play buttons
    const playButtons = document.querySelectorAll('.play-button');
    playButtons.forEach(button => {
        button.addEventListener('click', () => toggleSynth(button.dataset.synth));
    });

    // Set up event listeners for frequency sliders
    const frequencySliders = document.querySelectorAll('input[type="range"]');
    frequencySliders.forEach(slider => {
        slider.addEventListener('input', updateFrequency);
    });

    // Set up event listeners for waveform selects
    const waveformSelects = document.querySelectorAll('select');
    waveformSelects.forEach(select => {
        select.addEventListener('change', updateWaveform);
    });
});

function toggleSynth(synthIndex) {
    const index = parseInt(synthIndex) - 1;
    const synth = synths[index];
    const button = document.querySelector(`.play-button[data-synth="${synthIndex}"]`);

    if (synth.oscillator === null) {
        // Start the synth
        synth.oscillator = audioContext.createOscillator();
        synth.gainNode = audioContext.createGain();

        synth.oscillator.connect(synth.gainNode);
        synth.gainNode.connect(audioContext.destination);

        // Set initial frequency and waveform
        const frequencyInput = document.getElementById(`frequency${synthIndex}`);
        synth.oscillator.frequency.setValueAtTime(frequencyInput.value, audioContext.currentTime);

        const waveformSelect = document.getElementById(`waveform${synthIndex}`);
        synth.oscillator.type = waveformSelect.value;

        synth.oscillator.start();
        button.textContent = 'Stop';
    } else {
        // Stop the synth
        synth.oscillator.stop();
        synth.oscillator.disconnect();
        synth.gainNode.disconnect();
        synth.oscillator = null;
        synth.gainNode = null;
        button.textContent = 'Play';
    }
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
