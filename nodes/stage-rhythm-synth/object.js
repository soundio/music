import get          from 'fn/get.js';
import overload     from 'fn/overload.js';
import Stream       from 'fn/stream/stream.js';
import mix          from '../../modules/mix.js';
import StageObject  from '../../modules/graph-node.js';
import Waveform     from '../../modules/waveform.js';
import Data         from 'fn/data.js';
import Signal       from 'fn/signal.js';
import Event        from 'soundstage/event.js';
import { eventsToSamples, samplesToEvents } from '../../modules/rhythm.js';


const assign   = Object.assign;
const defaults = {};


function vectorsToSamples(vectors, samples = new vectors.constructor(vectors.length / 2)) {
    // Reject vectors below gate threshold
    const gatedVectors = new vectors.constructor(vectors.length);

    let j = gatedVectors.length / 4, j1, j2, max, mag, gain;
    while (j--) {
        j1 = j * 2;
        j2 = (0.5 * DATA.phasors.length - j) * 2;
        max  = j ? 0.25 * DATA.phasors.length / j : 0.5 * DATA.phasors.length ;
        mag  = DATA.phasors[2 * j];
        gain = mag / max;
        if (gain > data.gate) {
            if (j < 32) console.log(j);
            gatedVectors[j1]     = vectors[j1];
            gatedVectors[j1 + 1] = vectors[j1 + 1];
            gatedVectors[j2]     = vectors[j2];
            gatedVectors[j2 + 1] = vectors[j2 + 1];
        }
    }

    // Do the inverse FFT to print the output signal. THIS SHOULD BE
    // IN A SEPARATE RENDER FN SOMEWHERE. It's only here because
    // this is where updates happen, for now.
    const output = DATA.output = ifft(gatedVectors);
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


/* RhythmSynth */

export default class RhythmSynth extends StageObject {
    #events;

    constructor(id, data = {}) {
        // extends StageNode super(id, inputs, outputs)
        const inputs = {
            0: new Stream.Each(overload(get(1), {
                // TODO
                meter: (event) => {},
                start: (event) => {}
            })),
            size: 1
        };
        const outputs = { size: 1 };
        super(id, inputs, outputs);

        //this.data     = data;
        this.duration = data.duration || 1;
        this.events   = data.events;
    }

    get events() {
        // This logic is dodge. We get the input samples unless outputSamples
        // is available.
        //if (!this.wave || !this.wave.outputSamples)
        return this.#events;

        // TEMP pitch = 60
        //const outputEvents = samplesToEvents(this.wave.outputSamples, this.duration, 60);

        // TODO Mutate/merge output events with existing events
        //console.log(outputEvents);
        //return outputEvents;
    }

    set events(events) {
console.log('HELLO', events);
        events = this.#events = events.map(Event.from);

        Signal.tick(() => {
            // Meh we have to use Data?
            console.log('new wave');
            Data.of(this).wave = Waveform.from(eventsToSamples(Data.of(this.#events), this.duration));
        });
    }
}
