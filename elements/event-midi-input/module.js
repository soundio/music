import delegate         from 'dom/delegate.js';
import events           from 'dom/events.js';
import Data             from 'fn/data.js';
import get              from 'fn/get.js';
import Stream           from 'fn/stream/stream.js';
import overload         from 'fn/overload.js';
import element, { getInternals, render }  from 'dom/element-2.js';
import { toNoteName }   from 'midi/note.js';
import Event            from '../../../soundstage/modules/event.js';
import { lifecycle, properties } from '../stage-node/module.js';
import EventsMIDIInput from '../../modules/events-midi-input.js';
import typeOptions from '../html/type-options.js';


const assign = Object.assign;


/* Element */

export default element('<event-midi-input>', {
    mode: 'open',

    shadow: lifecycle.shadow + `
        <link rel="stylesheet" href="${ window.midiInputStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
    `,

    construct: function(shadow, internals) {
        // Is this the best place to do this?
        this.node = new EventsMIDIInput();

        lifecycle.construct.apply(this, arguments);
    },

    connect: function() {
        lifecycle.connect.apply(this, arguments);
    }
}, properties);
