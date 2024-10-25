import get        from 'fn/get.js';
import overload   from 'fn/overload.js';
import Stream     from 'fn/stream/stream.js';
import Event      from '../../soundstage/modules/event.js';
import mix        from './mix.js';
import EventsNode from './events-node.js';


const assign   = Object.assign;
const defaults = { filter: {}, transform: {} };


/* Filter */

const filter = overload(get('type'), {
    includes: (setting, value) => setting.data.includes(value),
    equals:   (setting, value) => setting.data === value
});

function filterEvent(setting, event) {
    return (!setting[0] || filter(setting[0], event[0]))
        && (!setting[1] || filter(setting[1], event[1]))
        && (!setting[2] || filter(setting[2], event[2]))
        && (!setting[3] || filter(setting[3], event[3]));
}


/* Transform */

const transform = overload(get('type'), {
    'fix':    (setting, event) => setting.data[0],
    'number': (setting, event) => setting.data[0],
    'string': (setting, event) => setting.data[0],
    // TODO: Implement clamp and normalise
    'from-2': (setting, event) => event[2],
    'from-3': (setting, event) => event[3]
});

function transformEvent(setting, event) {
    // New event or mutate existing event? New event.
    return Event.of(
        (setting[0] ? transform(setting[0], event) : event[0]),
        (setting[1] ? transform(setting[1], event) : event[1]),
        (setting[2] ? transform(setting[2], event) : event[2]),
        (setting[3] ? transform(setting[3], event) : event[3])
    );
}

/* Transform */

export default function Transform(id, data = assign({}, defaults)) {
    const inputs = {
        0: new Stream.Each((event) => {
            const { filter, transform } = this.data;

            // Filter matching events and push to output 1
            if (filterEvent(filter, event)) {
                if (outputs[1]) outputs[1].push(transformEvent(transform, event));
            }
            // Pass non-matching events to output 0
            else {
                if (outputs[0]) outputs[0].push(event);
            }
        }),

        size: 1
    };

    const outputs = { size: 2 };

    // extends EventsNode
    EventsNode.call(this, id, inputs, outputs);

    this.data = data;
}

mix(Transform.prototype, EventsNode.prototype);
