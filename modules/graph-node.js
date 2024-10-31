
import Stream from 'fn/stream/stream.js';


const assign = Object.assign;
const define = Object.defineProperties;
const descriptors = {
    inputs:  {},
    outputs: {}
};

let id = 0;

export const nodes = [];

function generateId() {
    let id = 0;
    while (++id && nodes.find((node) => node.id === id));
    return id;
}

/** StageNode() **/

export default function StageNode(id = generateId(), inputs = { size: 1 }, outputs = { size: 1 }) {
    this.id      = id;

    // Define inputs and outputs
    descriptors.inputs.value  = inputs;
    descriptors.outputs.value = outputs;
    define(this, descriptors);

    // Give inputs and outputs a reference to node
    let i = -1;
    while (inputs[++i]) inputs[i].node = this;
    let o = -1;
    while (outputs[++o]) outputs[i].node = this;

    // Maintain a registry of nodes
    nodes.push(this);
}

assign(StageNode.prototype, {
    input: function(i = 0) {
        if (i >= this.inputs.size) {
            throw new Error('StageNode attempt to get .input(' + i + '), node has ' + this.inputs.size + ' inputs');
        }

        // Actually I think inputs cannot be created dynamically, while outputs still can
        const inputs = this.inputs;
        return inputs[i] || (inputs[i] = new Input());
    },

    output: function(o = 0) {
        if (o >= this.outputs.size) {
            throw new Error('StageNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const outputs = this.outputs;
        return outputs[o] || (outputs[o] = assign(Stream.of(), { node: this }));
    },

    remove: function() {
        // NOT USED YET (TODO)
        console.trace();
    },

    toJSON: function() {
        return assign({}, this, {
            // Because .type is on prototype it does not automatically get added
            // to JSON
            type:  this.type,
            // Style is not really a part of Node, but it may be used by the
            // stage to maintain a document and this is a Quick and Dirty place
            // to keep it
            style: this.style && this.style.cssText || undefined
        });
    },

    stop: function() {
        let i = -1, input;
        while (input = this.inputs[++i]) input.stop();
        let o = -1, output;
        while (output = this.outputs[++i]) output.stop();

        return Stream.stop(this);
    },

    done: Stream.prototype.done
});

define(StageNode.prototype, {
    type: {
        get: function() {
            return this.constructor.name.toLowerCase();
        },

        enumerable: true
    }
});
