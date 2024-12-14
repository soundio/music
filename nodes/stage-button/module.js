import delegate         from 'dom/delegate.js';
import events           from 'dom/events.js';
import Data             from 'fn/data.js';
import get              from 'fn/get.js';
import Signal           from 'fn/signal.js';
import Stream           from 'fn/stream/stream.js';
import overload         from 'fn/overload.js';
import element          from 'dom/element.js';
import { toNoteName }   from 'midi/note.js';
import Event            from '../../../soundstage/modules/event.js';
import { lifecycle, properties } from '../stage-node/element.js';
import EventsButton from '../../modules/button-node.js';
import typeOptions from '../html/type-options.js';


const assign = Object.assign;


/* Element */

function update(element, value) {
    // Does element already have value? Ignore update
    if (element.value === '' + value) return;
    // Does element have focus? Ignore update
    if (element.getRootNode().activeElement === element) return;

    element.value = value;
}

export default element('<stage-button>', {
    mode: 'open',

    shadow: lifecycle.shadow + `
        <link rel="stylesheet" href="${ window.eventTransformerStylesheet || import.meta.url.replace(/js$/, 'css') }"/>

        <button type="button">Click</button>

        <form>
            <label for="pointerdown-1">Press / release</label>
            <select name="pointerdown-1">
                <option value="">-</option>
                ${ typeOptions }
            </select>

            <label for="pointerdown-2">2 Name</label>
            <input type="number" name="pointerdown-2"/>

            <label for="pointerdown-3">3 Value</label>
            <input type="number" step="0.01" name="pointerdown-3"/>

            <label for="pointerup-1">Release</label>
            <select name="pointerup-1">
                <option value="">-</option>
                ${ typeOptions }
            </select>

            <label for="pointerup-2">2 Name</label>
            <input type="number" name="pointerup-2" />

            <label for="pointerup-3">3 Value</label>
            <input type="number" step="0.01" name="pointerup-3" />
        </form>
    `,

    construct: function(shadow, internals) {
        const button = shadow.querySelector('button');
        lifecycle.construct.apply(this, arguments);

        events('input', shadow).each(delegate({
            '[name="pointerdown-1"]': (element, e) => Data.of(this.node.data).pointerdown[1] = element.value,
            '[name="pointerdown-2"]': (element, e) => Data.of(this.node.data).pointerdown[2] = Number(element.value),
            '[name="pointerdown-3"]': (element, e) => Data.of(this.node.data).pointerdown[3] = Number(element.value),
            '[name="pointerup-1"]':   (element, e) => Data.of(this.node.data).pointerup[1]   = element.value,
            '[name="pointerup-2"]':   (element, e) => Data.of(this.node.data).pointerup[2]   = Number(element.value),
            '[name="pointerup-3"]':   (element, e) => Data.of(this.node.data).pointerup[3]   = Number(element.value)
        }));

        events('pointerdown pointerup', button).each((e) => {
            const node    = this.node;
            const data    = node.data[e.type];
            const outputs = node.outputs;
            if (!data[1]) return;
            const event   = Event.of(e.timeStamp / 1000, data[1], data[2], data[3]);
            if (outputs[0]) outputs[0].push(event);
        });
    },

    connect: function(shadow, internals, data) {
        lifecycle.connect.apply(this, arguments);

        // Is this the best place to do this?
        /*this.node = new EventsButton(undefined, {
            pointerdown: { 1: "start", 2: 60, 3: 0.5 },
            pointerup:   { 1: "stop", 2: 60 }
        });*/

        const down1 = shadow.querySelector('[name="pointerdown-1"]');
        const down2 = shadow.querySelector('[name="pointerdown-2"]');
        const down3 = shadow.querySelector('[name="pointerdown-3"]');
        const up1   = shadow.querySelector('[name="pointerup-1"]');
        const up2   = shadow.querySelector('[name="pointerup-2"]');
        const up3   = shadow.querySelector('[name="pointerup-3"]');

        return [
            // Render transform fields
            Signal.frame(() => {
                const { pointerdown, pointerup } = Data.of(this.node.data);
                if (pointerdown[1]) update(down1, pointerdown[1]);
                if (pointerdown[2]) update(down2, pointerdown[2]);
                if (pointerdown[3]) update(down3, pointerdown[3]);
                if (pointerup[1]) update(up1, pointerup[1]);
                if (pointerup[2]) update(up2, pointerup[2]);
                if (pointerup[3]) update(up3, pointerup[3]);
            })
        ];
    }
}, properties);
