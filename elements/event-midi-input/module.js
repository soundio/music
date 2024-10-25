import create         from 'dom/create.js';
import events         from 'dom/events.js';
import Data           from 'fn/data.js';
import get            from 'fn/get.js';
import overload       from 'fn/overload.js';
import Signal         from 'fn/signal.js';
import truncate       from 'fn/truncate.js';
import element        from 'dom/element.js';
import { toNoteName } from 'midi/note.js';
import { MIDIInputs } from 'midi/ports.js';
import Event          from '../../../soundstage/modules/event.js';
import { lifecycle, properties } from '../stage-node/module.js';
import EventsMIDIInput from '../../modules/events-midi-input.js';
import typeOptions from '../html/type-options.js';


const assign = Object.assign;


/* Element */

export default element('<event-midi-input>', {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.midiInputStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>MIDI</h4>
        <select id="input-port">
            <option value selected disabled>Ports</option>
        </select>
        <svg class="outputs-svg" viewbox="0 0 12 18" width="12" height="16">
            <defs>
                <g id="output-g">
                    <circle cx="6" cy="9" r="4"></circle>
                    <line x1="6" y1="0" x2="6" y2="5"></line>
                </g>
            </defs>
        </svg>
    `,

    construct: function(shadow, internals) {
        const select = internals.select = shadow.getElementById('input-port');

        // Is this the best place to do this?
        lifecycle.construct.apply(this, arguments);

        MIDIInputs.each((port) => {
            const option = shadow.getElementById('input-port-' + port.id);

            if (option) option.disabled = port.state !== 'connected';
            else select.appendChild(create('option', {
                id:       'input-port-' + port.id,
                disabled: port.state !== 'connected',
                value:    port.id,
                html:     port.name
            }));
        });

        events('change', select).each((e) => this.node.data.port = select.value);
    },

    connect: function(shadow, internals) {
        const { select, $node } = internals;
        lifecycle.connect.apply(this, arguments);

        // ??????
        //this.node = new EventsMIDIInput();

        return [Signal.observe($node, (node) => {
            if (!node) return;
            select.value = node.data.port;
        })];
    }
}, properties);
