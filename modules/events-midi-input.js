
import Data                 from 'fn/data.js';
import get                  from 'fn/get.js';
import overload             from 'fn/overload.js';
import { frequencyToFloat } from 'midi/frequency.js';
import { int7ToFloat }      from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import { isNoteOn, isControl, toChannel, toType, toSignedFloat } from 'midi/message.js';
import MIDIEvents from 'midi/events.js';
import EventsNode from './events-node.js';


const assign   = Object.assign;
const defaults = {};

const toEvent = overload(toType, {
    noteon:  (message) => Event.of(0, 'start', message[2], message[3]),
    noteoff: (message) => Event.of(0, 'stop', message[2]),
    pitch:   (message) => Event.of(0, 'param', 'pitch', toSignedFloat(message)),
    control: overload(get(1), {
        2:  (message) => Event.of(0, 'param', 'force',   int7ToFloat(message[2])),
        7:  (message) => Event.of(0, 'param', 'volume',  int7ToFloat(message[2])),
        64: (message) => Event.of(0, 'param', 'sustain', message[2] ? 1 : 0),
        default: (message) => console.log('Unhandled MIDI message', message)
    }),
    default: (message) => console.log('Unhandled MIDI message', message)
});


function updateOutputs() {
    console.log('TODO?');
}

/* MIDIInput() */

export default function MIDIInput(data = defaults) {
    const inputs  = { size: 0 };
    const outputs = { size: 16 };
    EventsNode.call(this, inputs, outputs);
    this.data = Data.of(data);
}

assign(MIDIInput.prototype, EventsNode.prototype, {
    output: function(n = 0) {
        if (n >= this.outputs.size) {
            throw new Error('GraphNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const outputs = this.outputs;
        return outputs[n] || (outputs[n] = assign(
            MIDIEvents({ channel: n + 1 }).map(toEvent),
            { node: this }
        ));

        this.data = Data.of(data);

        Signal.tick(() => {
            const id = this.data.port;
            this.port = ports[id];
            updateOutputs(this.inputs, this.port);
        });

        MIDIOutputs.each((port) => {
            ports[port.id] = port;
            if (this.data.id === port.id) {
                this.port = port;
                updateOutputs(this.inputs, this.port);
            }
        });
    }
});

