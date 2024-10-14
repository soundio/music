
import get                  from 'fn/get.js';
import overload             from 'fn/overload.js';
import { frequencyToFloat } from 'midi/frequency.js';
import { int7ToFloat }      from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import { isNoteOn, isControl, toChannel, toType, toSignedFloat } from 'midi/message.js';
import MIDIOut from 'midi/output.js';
import EventsNode from './events-node.js';


const assign   = Object.assign;
const defaults = {};


/* MIDIOutputNode() */

export default function MIDIOutput(data = defaults) {
    const inputs  = { size: 16 };
    const outputs = { size: 0 };
    EventsNode.call(this, inputs, outputs);
    this.data = data;
}

assign(MIDIOutput.prototype, EventsNode.prototype, {
    input: function(n = 0) {
        if (n >= this.inputs.size) {
            throw new Error('GraphNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const inputs = this.inputs;
        return inputs[n] || (inputs[n] = assign(
            MIDIOut({ port: this.data.port, channel: n + 1 }),
            { node: this, hey: 'wanker' }
        ));
    }
});
