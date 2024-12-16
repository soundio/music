
import toGain from 'fn/to-gain.js';
import todB   from 'fn/to-db.js';

window.toGain = toGain;
window.todB   = todB;

const gain      = { min: 0,    max: toGain(6), law: 'log-24db', display: 'db', unit: 'dB' }; /* Currently display is implemented in the template */
const frequency = { min: 16,   max: 16384, law: 'log', unit: 'Hz' }; /* 16Hz - 16384kHz is 10 octaves */
const detune    = { min: -100, max: 100, step: 1, unit: 'cents' };

export const configs = {
    AnalyserNode: {
        fftSize:      { values: [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768] },
        minDecibels:  { min: -96, max: 0, unit: 'dB' },
        maxDecibels:  { min: -96, max: 0, unit: 'dB' },
        smoothingTimeConstant: {}
    },

    AudioBufferSourceNode: {
        // TODO: Flag these to render from sample start to sample end... but how?
        loopStart:    { min: 0, max: 1024, step: 1 },
        loopEnd:      { min: 0, max: 1024, step: 1 }
    },

    BiquadFilterNode: {
        type:         { values: ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'] },
        Q:            { min: 0.0001, max: 1000, law: 'log' },
        gain:         { min: -24, max: 24, unit: 'dB' }, /* Spec allows -40 to 40, I don't think I've ever used more than 15dB in real life! */
        frequency,
        detune
    },

    DelayNode: {
        // https://developer.mozilla.org/en-US/docs/Web/API/DelayNode/DelayNode
        delayTime:    { min: 0.001, max: 10,  law: 'log', unit: 's' },
        maxDelayTime: { min: 10,    max: 100, law: 'log', unit: 's' }
    },

    DynamicsCompressorNode: {
        // https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode/DynamicsCompressorNode
        knee:         { min: 0,   max: 40 },
        threshold:    { min: -90, max: 0, unit: 'dB' },
        attack:       { min: 0,   max: 1, law: 'log-36db' },
        release:      { min: 0,   max: 1, law: 'log-36db' },
        ratio:        { min: 1,   max: 20 },

        // TODO: flag properties as read only
        reduction: { readonly: true }
    },

    GainNode: { gain },

    OscillatorNode: {
        type:      { values: ["sine", "square", "sawtooth", "triangle", "custom"] },
        frequency,
        detune
    },

    PannerNode: {
        coneInnerAngle: { min: 0, max: 360, unit: '°' },
        coneOuterAngle: { min: 0, max: 360, unit: '°' },
        coneOuterGain:  { min: 0, max: 1,      law: 'log-48db' },
        maxDistance:    { min: 1, max: 100000, law: 'log' },
        refDistance:    { min: 0, max: 100,    law: 'log-60db' },
        rolloffFactor:  { /* TODO: Tricky, min max depends on distanceModel */ },
        panningModel:   { values: ['equalpower', 'HRTF'] },
        distanceModel:  { values: ['linear', 'inverse', 'exponential'] }
    },

    WaveShaperNode: {
        oversample: { values: ['none', '2x', '4x'] }
    }
};

export default function registerNode(constructor, config) {
    if (window.DEBUG) console.log('Registering ' + constructor.name);
    configs[constructor.name] = config;
}
