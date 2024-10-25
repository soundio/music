
import matches    from 'fn/matches.js';

import Harmoniser from './events-harmoniser.js';
import MIDIIn     from './events-midi-input.js';
import MIDIOut    from './events-midi-output.js';
import Button     from './events-button.js';
import Transform  from './events-transform.js';
//import Node       from './events-node.js';

const assign = Object.assign;
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

function toGraphNode(node) {
    return new constructors[node.type](node.id, node.data);
}

export default function Graph(nodes = [], pipes = []) {
    this.nodes = nodes.map(toGraphNode);

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

assign(Graph.prototype, {
    create: function(type, data) {
        const node = new constructors[type](generateId(), data);
        this.nodes.push(node);
        return node;
    },
});

assign(Graph, {
    from: function(data) {
        return new Graph(data.nodes, data.pipes);
    },

    register
});
