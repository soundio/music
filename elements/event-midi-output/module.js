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
import EventsMIDIOutput from '../../modules/events-midi-output.js';
import typeOptions from '../html/type-options.js';


const assign = Object.assign;


/* Element */

export default element('<event-midi-output>', {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.midiOutputStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>MIDI Output</h4>
        <ul class="inputs-ol"></ul>
    `,

    construct: function(shadow, internals) {
        const title     = shadow.querySelector('h4');
        const inputsOl  = shadow.querySelector('.inputs-ol');

        this.node = new EventsMIDIOutput();

        /* Set node as this.node */
        render(() => {
            const node = this.node;
            if (!node) return;

            let i = -1;
            let html = '';
            while (++i < node.inputs.size) html += `<li class="input-li" draggable="false" part="input-${ i }" data-index="${ i }" title="MIDI Channel ${ i + 1 }">${ i }</li>`;
            inputsOl.innerHTML = html;
        });

        events('dragstart', shadow).each((e) => {
            console.log('HELLO');
            //e.preventDefault();
            //e.stopPropagation();
        })
    },

    connect: function() {
        lifecycle.connect.apply(this, arguments);
    }
}, properties);
