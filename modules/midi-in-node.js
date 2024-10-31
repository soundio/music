
import Data                 from 'fn/data.js';
import get                  from 'fn/get.js';
import overload             from 'fn/overload.js';
import Signal               from 'fn/signal.js';
import { frequencyToFloat } from 'midi/frequency.js';
import { int7ToFloat }      from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import { isNoteOn, isControl, toChannel, toType, toSignedFloat } from 'midi/message.js';
import { MIDIInputs }       from 'midi/ports.js';
import MIDIEvents           from 'midi/events.js';
import mix                  from './mix.js';
import StageNode           from './graph-node.js';

const create = Object.create;
const assign = Object.assign;
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

const names = Array.from({ length: 16 }, (n, i) => 'Channel ' + (i + 1));

function updateOutputs(outputs, port) {
    let i;
    for (i in outputs) {
        if (!/^\d/.test(i)) continue;
        outputs[i].port = port;
    }
}

/* MIDIIn() */

export default function MIDIIn(id, data = {}) {
    const ports   = {};
    const inputs  = { size: 0 };
    const outputs = { size: 16, names };
    StageNode.call(this, id, inputs, outputs);
    this.data = Data.of(data);

    Signal.tick(() => {
        const id = this.data.port;
        this.port = ports[id];
        updateOutputs(this.inputs, this.port);
    });

    MIDIInputs.each((port) => {
        ports[port.id] = port;
        if (this.data.id === port.id) {
            this.port = port;
            updateOutputs(this.outputs, this.port);
        }
    });
}

assign(mix(MIDIIn.prototype, StageNode.prototype), {
    output: function ARSE(n = 0) {
        if (n >= this.outputs.size) {
            throw new Error('StageNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const outputs = this.outputs;
        return outputs[n] || (outputs[n] = assign(
            MIDIEvents({ channel: n + 1 }).map(toEvent),
            { node: this }
        ));
    }
});
