
import Stream from 'fn/stream/stream.js';


const assign = Object.assign;
const define = Object.defineProperties;

let id = 0;

export const nodes = [];

function generateId() {
    let id = 0;
    while (++id && nodes.find((node) => node.id === id));
    return id;
}

/** EventsNode() **/

export default function EventsNode(id = generateId(), inputs = { size: 1 }, outputs = { size: 1 }) {
    this.id      = id;
    this.inputs  = inputs;
    this.outputs = outputs;

    // Give inputs and outputs a reference to node
    let i = -1;
    while (inputs[++i]) inputs[i].node = this;
    let o = -1;
    while (outputs[++o]) outputs[i].node = this;

    // Maintain a registry of nodes
    nodes.push(this);
}

assign(EventsNode.prototype, {
    input: function(i = 0) {
        if (i >= this.inputs.size) {
            throw new Error('GraphNode attempt to get .input(' + i + '), node has ' + this.inputs.size + ' inputs');
        }

        // Actually I think inputs cannot be created dynamically, while outputs still can
        const inputs = this.inputs;
        return inputs[i] || (inputs[i] = new Input());
    },

    output: function(o = 0) {
        if (o >= this.outputs.size) {
            throw new Error('GraphNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const outputs = this.outputs;
        return outputs[o] || (outputs[o] = assign(Stream.of(), { node: this }));
    },

    destroy: function() {
        // NOT USED YET (TODO)
        let i = -1, input;
        while (input = this.inputs[++i]) input.stop();
        let o = -1, output;
        while (output = this.outputs[++i]) output.stop();
    },

    toJSON: function() {
        return {
            id:    this.id,
            type:  this.constructor.name.toLowerCase(),
            data:  this.data,
            pipes: Object.entries(this.outputs).reduce((pipes, [outputIndex, output]) => {
                let o = -1, input;
                while (input = output[++o]) {
                    const node = input.node;

                    console.log('NODE', input, node);

                    let inputIndex;
                    for (inputIndex in node.inputs) if (node.inputs[inputIndex] === input) break;
                    /*pipes.push({
                        output: { node: this.id, index: parseInt(outputIndex, 10) },
                        input:  { node: node.id, index: parseInt(inputIndex, 10) }
                    });*/
                    pipes.push(this.id, parseInt(outputIndex, 10), node.id, parseInt(inputIndex, 10));
                }

                return pipes;
            }, [])
        };
    }
});

define(EventsNode.prototype, {
    type: {
        get: function() {
            return this.constructor.name.toLowerCase();
        }
    }
});
