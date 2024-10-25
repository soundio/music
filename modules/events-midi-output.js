
import Data                 from 'fn/data.js';
import get                  from 'fn/get.js';
import noop                 from 'fn/noop.js';
import overload             from 'fn/overload.js';
import Signal               from 'fn/signal.js';
import { frequencyToFloat } from 'midi/frequency.js';
import { int7ToFloat }      from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import { isNoteOn, isControl, toChannel, toType, toSignedFloat } from 'midi/message.js';
import { MIDIOutputs } from 'midi/ports.js';
import MIDIOutput from 'midi/output.js';
import mix        from './mix.js';
import EventsNode from './events-node.js';


const assign   = Object.assign;
const defaults = {};
const names = Array.from({ length: 16 }, (n, i) => 'Channel ' + (i + 1));

/*
MIDIOut()

Schema:

```js
{
    data {
        port // MIDI output port
    }
}
```
*/

function updateInputs(inputs, port) {
    let i;
    for (i in inputs) {
        if (!/^\d/.test(i)) continue;
        inputs[i].port = port;
    }
}

export default function MIDIOut(id, data = {}, logFn) {
    const ports   = {};
    const inputs  = { size: 16, names };
    const outputs = { size: 0 };
    EventsNode.call(this, id, inputs, outputs);

    this.data  = Data.of(data);
    this.logFn = logFn;

    Signal.tick(() => {
        const id = this.data.port;
        this.port = ports[id];
        updateInputs(this.inputs, this.port);
    });

    MIDIOutputs.each((port) => {
        ports[port.id] = port;
        if (this.data.id === port.id) {
            this.port = port;
            updateInputs(this.inputs, this.port);
        }
    });
}

assign(mix(MIDIOut.prototype, EventsNode.prototype), {
    input: function(n = 0) {
        if (n >= this.inputs.size) {
            throw new Error('GraphNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const inputs = this.inputs;
        return inputs[n] || (inputs[n] = assign(
            MIDIOutput({ channel: n + 1 }, this.logFn),
            { node: this }
        ));
    }
});
