import get       from 'fn/get.js';
import noop      from 'fn/noop.js';
import overload  from 'fn/overload.js';
import Stream    from 'fn/stream/stream.js';
import mix       from '../../modules/mix.js';
import StageNode from '../../modules/graph-node.js';
import Waveform  from '../../modules/waveform.js';
import blacklist from '../../modules/blacklist.js';
import Data      from 'fn/data.js';
import Signal    from 'fn/signal.js';
import Event     from 'soundstage/event.js';
import NodeGraph from '../../../soundstage/nodes/graph.js';
import { eventsToSamples, samplesToEvents } from '../../modules/rhythm.js';


const assign    = Object.assign;


export default class StageAudio extends StageNode {
//    #audioNode;
    #connections = [];
// TEMP context
    constructor(id, setting = {}, context) {
        // extends StageNode super(id, inputs, outputs)
        const inputs = {
            0: new Stream.Each(overload(get(1), {
                start: (event) => this.get('output').start(event[0], event[2], event[3]),
                stop:  (event) => this.get('output').stop(event[0], event[2]),
                param: (event) => {
                    const audioNode = this.get('output');
                    // We may be in uninitialised state. Ought not to be, but
                    // could happen.
                    if (!audioNode) return;

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

        this.context = context;
        this.TYPE    = setting.TYPE;
        this.data    = setting.data;
    }

    set data(data) {
        // Ultimately we may look at making objects capable of having graphs.
        // I mean, why not? Right now lets implement the old API but with a
        // NodeGraph call.
        NodeGraph.call(this, this.context, {
            nodes: {
                output: { type: this.TYPE, data }
            }
        }, this.transport);
    }

    get data() {
        return this.get('output');
    }

    get() {
        return NodeGraph.prototype.get.apply(this, arguments);
    }

    connect(object) {
        const outputNode = this.get('output');
        const inputNode  = object.data;
        outputNode.connect.call(outputNode, inputNode);
        /* FIND A PLACE TO STORE CONNECTION... oooo, could we broadcast the
           connection with some sort of event? That's a new idea. */
        this.#connections.push({ object });
        return this;
    }

    //disconnect() {
    //    const audioNode = this.data;
    //    audioNode.disconnect.apply(this, arguments);
    //}

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
