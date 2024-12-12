import { fft, ifft } from './fft.js';


const assign  = Object.assign;



/* TODO: Put these somewhere with utility functions */
function angle(x, y) {
    return Math.atan2(y, x);
}

function magnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}

function vectorsTophasors(vectors) {
    const phasors = new vectors.constructor(vectors.length);

    let n = vectors.length;
    while (n) {
        phasors[--n] = angle(vectors[n - 1], vectors[n]);
        phasors[--n] = magnitude(vectors[n], vectors[n + 1]);
    }

    return phasors;
}

/**
Waveform(samples, duration)
An object that analyses a `samples` array via FFT and publishes arrays of
vectors and of polar coordinates.
**/

export default class Waveform {
    static from(object) {
        return new Waveform(object);
    }

    #samples;
    #vectors;
    #phasors;
    #gate;
    #gated;

    constructor(samples) {
        this.samples  = samples;
        this.size     = samples.length;
        this.gate     = 0;

        console.table({
            magnitude: this.phasors.filter((n, i) => i % 2 === 0).slice(0, 8).map((n) => n.toFixed(6)),
            phase:     this.phasors.filter((n, i) => i % 2 !== 0).slice(0, 8)
        });
    }

    set samples(samples) {
        this.#vectors = undefined;
        this.#phasors = undefined;
        return this.#samples = samples;
    }

    get samples() {
        return this.#samples;
    }

    get vectors() {
        return this.#vectors
            || (this.#vectors = fft(this.#samples));
    }

    get phasors() {
        return this.#phasors
            || (this.#phasors = vectorsTophasors(this.vectors));
    }

    get outputSamples() {
        // Reject vectors below gate threshold
        const { vectors, phasors } = this;
        const length = vectors.length;
        const gatedVectors = this.#gated || (this.#gated = new this.vectors.constructor(length));

        let j = gatedVectors.length / 4, j1, j2, max, mag, gain;
        while (j--) {
            j1   = j * 2;
            j2   = (0.5 * length - j) * 2;
            max  = j ? 0.25 * length / j : 0.5 * length ;
            mag  = phasors[2 * j];
            gain = mag / max;
            if (gain > this.gate) {
                gatedVectors[j1]     = vectors[j1];
                gatedVectors[j1 + 1] = vectors[j1 + 1];
                gatedVectors[j2]     = vectors[j2];
                gatedVectors[j2 + 1] = vectors[j2 + 1];
            }
        }

        const output = ifft(gatedVectors);
        const samples = new output.constructor(0.5 * length);
        let i = output.length, x, y;
        while (i) {
            y = output[--i];
            x = output[--i];
            // All imaginary parts should be 0, or very near 0
            if (y < -0.000000001 && y > 0.000000001) console.log('PHASE NOT 0!!! What gives?');
            // Real parts are the samples, write them back to the samples buffer
            samples[i / 2] = x;
        }

        return samples;
    }

    /**
    .sampleAt(i)
    Gets sample value at index `i`.
    **/
    sampleAt(n) {
        return this.samples[n];
    }

    /**
    .gainAt(f)
    Gets gain of frequency index `f`.
    **/
    gainAt(n) {
        return 2 * this.phasors[2 * n] / this.phasors.length;
    }

    /**
    .magnitudeAt(f)
    Gets weighted magnitude of frequency index `f`.
    **/
    magnitudeAt(n) {
        return this.phasors[2 * n];
    }

    /**
    .phaseAt(f)
    Gets phase of frequency index `f`.
    **/
    phaseAt(n) {
        return this.phasors[2 * n + 1];
    }

    /**
    .vectorAt(f)
    Gets `[real, imaginary]` vector at frequency index `f`. The vector is a
    subarray view of the same underlying data as the waveform - mutating numbers
    in this array will change the waveform.
    **/
    vectorAt(n) {
        const vectors = this.#vectors;
        const buffer  = vectors.buffer;
        const bytes   = vectors.constructor.BYTES_PER_ELEMENT * n * 2;
        return new vectors.constructor(buffer, bytes, 2);
    }

    /**
    .phasorAt(f)
    Gets `[magnitude, phase]` polar at frequency index `f`. The vector is a
    subarray view of the same underlying data as the waveform - mutating numbers
    in this array will change the waveform.
    **/
    phasorAt(n) {
        const phasors = this.#phasors;
        const buffer = phasors.buffer;
        const bytes  = phasors.constructor.BYTES_PER_ELEMENT * n * 2;
        return new phasors.constructor(buffer, bytes, 2);
    }
}

