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
import { lifecycle, properties } from '../stage-node/module.js';
import EventsTransform  from '../../modules/events-transform.js';


const assign = Object.assign;


/* Element */

function update(element, value) {
    // Does element already have value? Ignore update
    if (element.value === '' + value) return;
    // Does element have focus? Ignore update
    if (element.getRootNode().activeElement === element) return;

    element.value = value;
}

export default element('<event-transform>', {
    mode: 'open',

    shadow: lifecycle.shadow + `
        <link rel="stylesheet" href="${ window.eventTransformerStylesheet || import.meta.url.replace(/js$/, 'css') }"/>

        <form>
            <label for="filter-0">0 Time</label>
            <input type="text" name="filter-0" value="↓" readonly disabled />

            <label for="filter-1">1 Type</label>
            <select name="filter-1" id="filter-1">
                <option value="startstop">"start/stop"</option>
                <option value="start">"start"</option>
                <option value="stop">"stop"</option>
                <option value="param">"param"</option>
            </select>
            <label for="filter-2">2 Name</label>
            <select name="filter-2" id="filter-2">
                <option value="" selected>↓</option>
                ${ /*TODO: Implement range filter, update option names base don type - better with a datalist? */ '' }
                <option value="range">Range</option>
                ${ Array.from({ length: 128 }).map((n, i) => `<option value="${ i }">${ i } - ${ toNoteName(i) }</option>`) }
            </select>
            <label for="filter-3">3 Value</label>
            <select name="filter-3">
                <option value="" selected>↓</option>
            </select>

            <label for="transform-0">0 Time</label>
            <select name="transform-0" id="transform-0">
                <option value="from-0" selected>Event 0</option>
            </select>

            <label for="transform-1">1 Type</label>
            <select name="transform-1" id="transform-1">
                <option value="">Event 1</option>
                <hr/>
                <option value="startstop">"start/stop"</option>
                <option value="start">"start"</option>
                <option value="stop">"stop"</option>
                <option value="param">"param"</option>
            </select>

            <label for="transform-2">2 Name</label>
            <select name="transform-2" id="transform-2">
                <option value="from-2" selected>Event 2</option>
                <option value="from-3">Event 3</option>
                <hr/>
                <option value="number">Number</option>
                <option value="string">String</option>
                <hr/>
                ${ /*TODO: modify options based on output event type */ '' }
                <option value="force">"force"</option>
                <option value="pitch">"pitch"</option>
            </select>
            <fieldset id="transform-2-data">
                <input type="number" name="transform-2-data" step="1" value="0" data-type="number" />
                <input type="text" name="transform-2-data" value="" data-type="string" />
            </fieldset>

            <label for="transform-3">3 Value</label>
            <select name="transform-3">
                <option value="from-2">Event 2</option>
                <option value="from-3" selected>Event 3</option>
                <hr/>
                <option value="number">Number</option>
            </select>
            <fieldset id="transform-3-data">
                <input type="number" name="transform-3-data" step="0.02" value="1" data-type="number" />
            </fieldset>
        </form>
    `,

    construct: function(shadow, internals) {
        lifecycle.construct.apply(this, arguments);

        events('input', shadow).each(delegate({
            '[name="filter-1"]':    (element, e) => Data.of(this.node.data).filter[1] =
                element.value === 'startstop' ? { type: 'includes', data: ['start', 'stop'] } :
                { type: 'equals', data: element.value },

            '[name="filter-2"]':    (element, e) => Data.of(this.node.data).filter[2] = { type: 'equals', data: element.value },
            '[name="filter-3"]':    (element, e) => Data.of(this.node.data).filter[3] = { type: 'equals', data: element.value },
            '[name="transform-0"]': (element, e) => Data.of(this.node.data).transform[0] = { type: 'fix', data: [element.value] },
            '[name="transform-1"]': (element, e) => Data.of(this.node.data).transform[1] = { type: 'fix', data: [element.value] },

            '[name="transform-2"]': (element, e) => Data.of(this.node.data).transform[2] =
                element.value === 'number' ? { type: 'number', data: [0] } :
                element.value === 'string' ? { type: 'string', data: [''] } :
                element.value === 'from-2' ? { type: 'from-2', data: [] } :
                element.value === 'from-3' ? { type: 'from-3', data: [] } :
                { type: 'fix', data: [element.value] },

            '[name="transform-2-data"]': (element, e) => {
                const transform = Data.of(this.node.data.transform[2]);
                transform.data[0] =
                    transform.type === 'string' ? element.value.trim() :
                    // Default to type number
                    Number(element.value) ;
            },

            '[name="transform-3"]': (element, e) => Data.of(this.node.data).transform[3] =
                element.value === 'number' ? { type: 'number', data: [0] } :
                element.value === 'from-2' ? { type: 'from-2', data: [] } :
                element.value === 'from-3' ? { type: 'from-3', data: [] } :
                { type: 'fix', data: [element.value] },

            '[name="transform-3-data"]': (element, e) => {
                const transform = Data.of(this.node.data).transform[3];
                transform.data[0] =
                    transform.type === 'string' ? element.value.trim() :
                    // Default to type number
                    Number(element.value) ;
            }
        }));
    },

    connect: function(shadow, internals, data) {
        lifecycle.connect.apply(this, arguments);

        // Is this the best place to do this?
        //this.node = new EventsTransform();

        const filter1 = shadow.querySelector('[name="filter-1"]');
        const filter2 = shadow.querySelector('[name="filter-2"]');
        const filter3 = shadow.querySelector('[name="filter-3"]');
        const transform0 = shadow.querySelector('[name="transform-0"]');
        const transform1 = shadow.querySelector('[name="transform-1"]');
        const transform2 = shadow.querySelector('[name="transform-2"]');
        const transform3 = shadow.querySelector('[name="transform-3"]');
        const transform2Fieldset = shadow.getElementById('transform-2-data');
        const transform3Fieldset = shadow.getElementById('transform-3-data');

        const renderFieldset = (fieldset, n) => {
            const { transform } = Data.of(this.node.data);
            let i = -1, element;
            while (element = fieldset.children[++i]) {
                element.hidden = !transform[n] || element.dataset.type !== transform[n].type;
            }
        };

        return [
            // Render filter fields
            Signal.frame(() => {
                const { filter } = Data.of(this.node.data);
                if (filter[1]) update(filter1, filter[1].type);
                if (filter[2]) update(filter2, filter[2].type);
                if (filter[3]) update(filter3, filter[3].type);
            }),

            // Render transform fields
            Signal.frame(() => {
                const { transform } = Data.of(this.node.data);
                if (transform[0]) update(transform0, transform[0].type === 'fix' ? transform[0].data[0] : transform[0].type);
                if (transform[1]) update(transform1, transform[1].type === 'fix' ? transform[1].data[0] : transform[1].type);
                if (transform[2]) update(transform2, transform[2].type === 'fix' ? transform[2].data[0] : transform[2].type);
                if (transform[3]) update(transform3, transform[3].type === 'fix' ? transform[3].data[0] : transform[3].type);
            }),

            // Render fieldsets
            Signal.frame(() => renderFieldset(transform2Fieldset, 2)),
            Signal.frame(() => renderFieldset(transform3Fieldset, 3))
        ];
    }
}, properties);
