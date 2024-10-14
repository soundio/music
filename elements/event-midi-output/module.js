import delegate       from 'dom/delegate.js';
import events         from 'dom/events.js';
import Data           from 'fn/data.js';
import get            from 'fn/get.js';
import Stream         from 'fn/stream/stream.js';
import overload       from 'fn/overload.js';
import element        from 'dom/element.js';
import { toNoteName } from 'midi/note.js';
import Event          from '../../../soundstage/modules/event.js';
import { lifecycle, properties } from '../stage-node/module.js';
import EventsMIDIOutput from '../../modules/events-midi-output.js';
import typeOptions    from '../html/type-options.js';


const assign = Object.assign;


/* Element */

export default element('<event-midi-output>', {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.midiOutputStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>MIDI Output</h4>
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
        this.node = new EventsMIDIOutput();
        lifecycle.construct.apply(this, arguments);
    },

    connect: function() {
        lifecycle.connect.apply(this, arguments);
    }
}, properties);
