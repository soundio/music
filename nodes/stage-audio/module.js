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


const assign    = Object.assign;
const blacklist = {
    channelCount: true,
    channelCountMode: true,
    channelInterpretation: true,
    context: true,
    numberOfInputs: true,
    numberOfOutputs: true,
    onended: true
};


/* TEMP */
import Mix from '../../../soundstage/nodes/mix.js';
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
                param: (event) => {
                    const audioNode = this.#audioNode;
                    const name  = event[2];
                    const value = event[3];
                    const param = audioNode[name];

                    // All this stuff should be handled by soundstage.. look it up
                    if (typeof param === 'object') {
                        if (param.setValueAtTime) {
                            // Value can only be numeric here, we should split this sooner
                            param.setValueAtTime(value, audioNode.context.currentTime);
                            // TODO We're gonna need to notify updates somehow
                            // ??? Data.notify(param);
                        }
                        else {
                            console.log('HUH? Is it a signal?', param);
                        }
                    }
                    else {
                        console.log(name, value);
                        Data.of(audioNode)[name] = value;
                    }
                },
                default: noop
            })),

            size: 1
        };

        const outputs = { size: 1 };

        super(id, inputs, outputs);

    }

    set data(data) {
        // Ultimately audio node is chosen by .type, of course
        this.#audioNode = new Mix(audio, data);
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

    toJSON() {
        const node = this.data;
        const data = {};

        let name;
        for (name in node) {
            //if (!this.hasOwnProperty(name)) { continue; }
            if (node[name] === null)      { continue; }
            if (node[name] === undefined) { continue; }
            if (blacklist[name])          { continue; }

                // Is it an AudioParam or pseudo-AudioParam
            data[name] = node[name].setValueAtTime ? node[name].value :
                // Is it a... TODO: what are we doing here?
                node[name].connect ? toJSON.apply(node[name]) :
                // Get value of property
                node[name] ;
        }

        return {
            id:     this.id,
            type:   this.type,
            events: this.events,
            node:   data
        };
    }
}
