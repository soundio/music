
import create         from 'dom/create.js';
import events         from 'dom/events.js';
import Data           from 'fn/data.js';
import get            from 'fn/get.js';
import Signal         from 'fn/signal.js';
import Stream         from 'fn/stream/stream.js';
import overload       from 'fn/overload.js';
import postpad        from 'fn/postpad.js';
import truncate       from 'fn/truncate.js';
import element        from 'dom/element.js';
import { toNoteName } from 'midi/note.js';
import { toChannel, toType } from 'midi/message.js';
import { MIDIOutputs } from 'midi/ports.js';
import Event          from '../../../soundstage/modules/event.js';
import { lifecycle, properties } from '../stage-node/module.js';
import EventsMIDIOutput from '../../modules/midi-out-node.js';
import typeOptions    from '../html/type-options.js';


const assign = Object.assign;


/* Element */

export default element('<stage-midi-out>', {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.midiOutputStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>MIDI Output</h4>
        <select id="output-port">
            <option value selected disabled>Ports</option>
        </select>
        <svg class="inputs-svg" viewbox="0 0 12 18" width="12" height="16">
            <defs>
                <g id="input-g">
                    <circle cx="6" cy="9" r="4"></circle>
                    <line x1="6" y1="13" x2="6" y2="18"></line>
                </g>
            </defs>
        </svg>
    `,

    construct: function(shadow, internals) {
        const select = internals.select = shadow.getElementById('output-port');

        lifecycle.construct.apply(this, arguments);

        MIDIOutputs.each((port) => {
            const option = shadow.getElementById('output-port-' + port.id);
            if (option) option.disabled = port.state !== 'connected';
            else select.appendChild(create('option', {
                id:       'output-port-' + port.id,
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

        /*
        this.node = new EventsMIDIOutput(undefined, {}, (message) => {
            const monitor = document.getElementById('midi-monitor');
            monitor.innerHTML += `\n ${ this.node.port.name }  ${ postpad(' ', 3, toChannel(message)) } ${ postpad(' ', 8, toType(message)) } ${ postpad(' ', 4, toType(message).startsWith('note') ? toNoteName(message[1]) : message[1]) } ${ postpad(' ', 3, message[2]) } `;
            monitor.scrollTop = 10000000;
        });
        */

        return [Signal.observe($node, (node) => {
            if (!node) return;
            select.value = node.data.port;
        })];
    }
}, properties);
