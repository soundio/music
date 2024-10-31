
import matches    from 'fn/matches.js';

import Harmoniser from './harmoniser-node.js';
import MIDIIn     from './midi-in-node.js';
import MIDIOut    from './midi-out-node.js';
import Button     from './button-node.js';
import Transform  from './transform-node.js';
//import Node       from './graph-node.js';

const assign  = Object.assign;
const define  = Object.defineProperties;
const version = 1;
const constructors = {};

function register(constructor) {
    constructors[constructor.name.toLowerCase()] = constructor;
}

register(Harmoniser);
register(MIDIIn);
register(MIDIOut);
register(Button);
register(Transform);
//register(Node);


/** Graph() **/

let id = 0;

function generateId() {
    let id = 0;
    while (++id && nodes.find((node) => node.id === id));
    return id;
}

function remove(nodes, node) {
    const i = nodes.indexOf(node);
    nodes.splice(i, 1);
    return nodes;
}

function toStageNode(node) {
    return new constructors[node.type](node.id, node.data);
}

function isPipedTo(stream1, stream2) {
    let n = 0;
    while (stream2[--n]) if (stream2[n] === stream1) return true;
}

function getPipesFromNode(pipes = [], outputNode) {
    return Object.entries(outputNode.outputs).reduce((pipes, [outputIndex, output]) => {
        // Ignore non-numeric output indexes ('size', 'names', etc.)
        if (!/^\d/.test(outputIndex)) return pipes;
        // Loop over outputs
        let o = -1, input;
        while (input = output[++o]) {
            const inputNode = input.node;
            let inputIndex;
            for (inputIndex in inputNode.inputs) {
                // Ignore non-numeric input indexes ('size', 'names', etc.)
                if (!/^\d/.test(inputIndex)) continue;
                // Check if output stream is piped to this input stream
                if (!isPipedTo(output, inputNode.inputs[inputIndex])) continue;
                // Push the numbers into the pipes array
                pipes.push(outputNode.id, parseInt(outputIndex, 10), inputNode.id, parseInt(inputIndex, 10));
            }
        }
        return pipes;
    }, pipes);
}

function getPipesFromNodes(nodes) {
    return nodes.reduce(getPipesFromNode, []);
}

export default function Graph(nodes = [], pipes = []) {
    this.nodes = nodes.map((data) => {
        // Create node from data...
        const node = toStageNode(data);
        // ...and remove it when it's done
        return node.done(() => remove(this.nodes, node));
    });

    // Pipe nodes to one another
    const length = pipes.length;
    let n = -1;
    while (++n < length) {
        console.log('Piping ' + pipes[n] + '.output(' + pipes[n+1] + ') to ' + pipes[n+2] + '.input(' + pipes[n+3] + ')');
        const outputNode = this.nodes.find(matches({ id: pipes[n] }));
        const output     = outputNode.output(pipes[++n]);
        const inputNode  = this.nodes.find(matches({ id: pipes[++n] }));
        const input      = inputNode.input(pipes[++n]);
        output.pipe(input);
    }
}
/*
define(Graph.prototype, {
    pipes: {
        get:
    }
});
*/
assign(Graph.prototype, {
    create: function(type, data) {
        const node = new constructors[type](generateId(), data);
        this.nodes.push(node.done(() => remove(this.nodes, node)));
        return node;
    },

    toJSON: function() {
        this.version = version;
        this.pipes   = getPipesFromNodes(this.nodes);
        return this;
    }
});

assign(Graph, {
    from: function(data) {
        return new Graph(data.nodes, data.pipes);
    },

    register
});
