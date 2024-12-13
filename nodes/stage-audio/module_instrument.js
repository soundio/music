import get       from 'fn/get.js';
import noop      from 'fn/noop.js';
import overload  from 'fn/overload.js';
import Stream    from 'fn/stream/stream.js';
import mix       from '../../modules/mix.js';
import StageNode from '../../modules/graph-node.js';
import Waveform  from '../../modules/waveform.js';
import Data      from 'fn/data.js';
import Signal    from 'fn/signal.js';
import Event     from 'soundstage/event.js';
import { eventsToSamples, samplesToEvents } from '../../modules/rhythm.js';


const assign   = Object.assign;
const defaults = {};




// Setup voice. TODO: All this faff really should not be necessary.
import Envelope   from '../../../soundstage/nodes/envelope.js';
import Mix        from '../../../soundstage/nodes/mix.js';
import Sample     from '../../../soundstage/nodes/sample-set.js';
import Graph      from '../../../soundstage/nodes/graph.js';
import Instrument from '../../../soundstage/nodes/instrument.js';
assign(Graph.constructors, {
    envelope: Envelope,
    sample:   Sample,
    mix:      Mix
});
const audio = new window.AudioContext();





/* RhythmSynth */

export default class StageAudio extends StageNode {
    #audioNode;

    constructor(id, setting = {}) {
        // extends StageNode super(id, inputs, outputs)
        const inputs = {
            0: new Stream.Each(overload(get(1), {
                start: (event) => this.#audioNode.start(event[0], event[2], event[3]),
                stop:  (event) => this.#audioNode.stop(event[0], event[2]),
                default: noop
            })),

            size: 1
        };

        const outputs = { size: 1 };

        super(id, inputs, outputs);

    }

    set data(data) {
        // Ultimately audio node is chosen by .type, of course
        this.#audioNode = new Instrument(audio, data);
        this.#audioNode.connect(audio.destination);
    }

    get data() {
        return this.#audioNode;
    }

    connect() {
        const audioNode = this.data;
        audioNode.connect.apply(this, arguments);
    }

    disconnect() {
        const audioNode = this.data;
        audioNode.disconnect.apply(this, arguments);
    }
}
