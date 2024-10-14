
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
import MIDIOut from 'midi/output.js';
import EventsNode from './events-node.js';


const assign   = Object.assign;
const defaults = {};


/*
MIDIOutputNode()

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
        if (i === 'size') continue;
        inputs[i].port = port;
    }
}

export default function MIDIOutput(data = defaults, logFn) {
    const ports   = {};
    const inputs  = { size: 16 };
    const outputs = { size: 0 };
    EventsNode.call(this, inputs, outputs);

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

assign(MIDIOutput.prototype, EventsNode.prototype, {
    input: function(n = 0) {
        if (n >= this.inputs.size) {
            throw new Error('GraphNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const inputs = this.inputs;
        return inputs[n] || (inputs[n] = assign(
            MIDIOut({ channel: n + 1 }, this.logFn),
            { node: this }
        ));
    }
});
