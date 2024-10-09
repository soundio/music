
import EventsNode from './events-node.js';

const assign   = Object.assign;
const defaults = {};

/* Button */

export default function Button(data = defaults) {
    const inputs  = { size: 0 };
    const outputs = { size: 1 };

    // extends EventsNode
    EventsNode.call(this, inputs, outputs);

    this.data = data;
}

assign(Button.prototype, EventsNode.prototype);
