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

    #vectors;
    #phasors;

    constructor(samples) {
        this.samples  = samples;
        this.size     = samples.length;

        /*console.table({
            magnitude: this.phasors.filter((n, i) => i % 2 === 0).slice(0, 8).map((n) => n.toFixed(6)),
            phase:     this.phasors.filter((n, i) => i % 2 !== 0).slice(0, 8)
        });*/
    }

    get vectors() {
        return this.#vectors
            || (this.#vectors = fft(this.samples));
    }

    get phasors() {
        return this.#phasors
            || (this.#phasors = vectorsTophasors(this.vectors));
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

