
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
    this.id = id;

    // Define inputs and outputs
    descriptors.inputs.value  = inputs;
    descriptors.outputs.value = outputs;
    define(this, descriptors);

    // Give them all a reference to this
    let n;
    for (n in this.inputs)  if (/^\d/.test(n)) this.inputs[n].node  = this;
    for (n in this.outputs) if (/^\d/.test(n)) this.outputs[n].node = this;

    // Maintain a registry of nodes
    nodes.push(this);
}

assign(StageNode.prototype, {
    input: function(i = 0) {
        if (i >= this.inputs.size) {
            throw new Error('StageNode attempt to get .input(' + i + '), node has ' + this.inputs.size + ' inputs');
        }

        // Actually inputs perhaps should not be created dynamically, because if
        // an input is needed it must do something ... ?
        const inputs = this.inputs;
        return inputs[i] || (inputs[i] = assign(Stream.of(), { node: this }));
    },

    output: function(o = 0) {
        if (o >= this.outputs.size) {
            throw new Error('StageNode attempt to get .output(' + o + '), node has ' + this.outputs.size + ' outputs');
        }

        const outputs = this.outputs;
        return outputs[o] || (outputs[o] = assign(Stream.of(), { node: this }));
    },

    toJSON() {
        const node = this.data;
        const data = {};

        // Assemble node settings
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
            // Because .type is on prototype it does not automatically get added
            // to JSON
            type:   this.type,
            events: this.events,
            node:   data,
            // Style is not really a part of Node, but it may be used by the
            // stage to maintain a document and this is a Quick and Dirty Place
            // to Keep It
            style:  this.style && this.style.cssText || undefined
        };
    },

    stop: function() {
        let n;
        for (n in this.inputs)  if (/^\d/.test(n)) this.inputs[n].stop();
        for (n in this.outputs) if (/^\d/.test(n)) this.outputs[n].stop();
        // Call .done(fn) observer functions
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
