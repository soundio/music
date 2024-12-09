import get        from 'fn/get.js';
import overload   from 'fn/overload.js';
import Stream     from 'fn/stream/stream.js';
import mix        from '../../modules/mix.js';
import StageNode  from '../../modules/graph-node.js';
import Waveform   from '../../modules/waveform.js';

import Data          from 'fn/data.js';
import denormalise   from 'fn/denormalise.js';
import normalise     from 'fn/normalise.js';
import Event         from 'soundstage/event.js';

import { angle, magnitude } from '../../modules/vector.js';
import { vectorsToPolars } from '../../modules/spectrum.js';
import { fft, ifft } from '../../modules/fft.js';
import { eventsToSamples, samplesToEvents } from '../../modules/rhythm.js';
import { plotYAxis, plot, plotWaveform, plotBuffer, plotSignpost, plotSamples, plotMeter } from '../../modules/canvas.js';
import { dB12, dB24, dB60, dB96 } from 'form/modules/constants.js';
import { getScale }  from 'form/modules/scales.js';


const assign   = Object.assign;
const defaults = {};


/* RhythmSynth */

export default class RhythmSynth extends StageNode {
    #events;
    #samples;
    #vectors;
    #polars;

    constructor(id, data = {}) {
        const inputs = {
            0: new Stream.Each(overload(get(1), {
                // TODO
                meter: (event) => {},
                start: (event) => {}
            })),

            size: 1
        };

        const outputs = { size: 1 };

        // extends StageNode super(id, inputs, outputs)
        super(id, {
            0: new Stream.Each(overload(get(1), {
                // TODO on input event
                meter: (event) => {},
                start: (event) => {}
            })),

            size: 1
        }, { size: 1 });

        this.data     = data;
        this.duration = data.duration || 1;
        this.events   = data.events   || [];
    }

    get events() {
        return this.#events;
    }

    set events(events) {
        this.#events  = events;
        this.waveform = Waveform.from(this.samples);
    }

    get samples() {
        return this.#samples
            || (this.#samples = eventsToSamples(this.events, this.duration));
    }
}

mix(RhythmSynth.prototype, StageNode.prototype);
