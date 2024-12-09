import create         from 'dom/create.js';
import events         from 'dom/events.js';
import Data           from 'fn/data.js';
import get            from 'fn/get.js';
import overload       from 'fn/overload.js';
import postpad        from 'fn/postpad.js';
import Signal         from 'fn/signal.js';
import truncate       from 'fn/truncate.js';
import element        from 'dom/element.js';
import { toNoteName } from 'midi/note.js';
import Event          from '../../../soundstage/modules/event.js';
import GraphNode      from '../../modules/graph-node.js';
import { lifecycle, properties } from '../stage-node/module.js';
import typeOptions from '../html/type-options.js';


const assign = Object.assign;


/* Element */

export default element('<stage-monitor>', {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.midiInputStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>Monitor</h4>
        <pre>\n\n\n\n</pre>
        <svg class="inputs-svg" viewbox="0 0 12 18" width="12" height="18">
            <defs>
                <g id="input-g">
                    <circle cx="6" cy="9" r="4"></circle>
                    <line x1="6" y1="13" x2="6" y2="18"></line>
                </g>
            </defs>
        </svg>
    `,

    construct: function(shadow, internals) {
        const pre = internals.pre = shadow.querySelector('pre');
        lifecycle.construct.apply(this, arguments);

        let observer;
        Signal.observe(internals.$node, (node) => {
            if (observer) observer.stop();
            if (!node) return;
            observer = node.inputs[0].each((event) => {
                pre.innerHTML =
                    (pre.innerHTML + `\n ${ event[0].toFixed(3) } ${ postpad(' ', 8, event[1]) } ${ event[2] } ${ event[3] || '' } ${ event[4] || '' }`)
                    .slice(-96);
                pre.scrollTop = pre.scrollHeight;
            });
        });
    },

    connect: function(shadow, internals) {
        lifecycle.connect.apply(this, arguments);

        // Where node is not yet defined give StageMonitor a generic GraphNode
        if (!this.node) this.node = new GraphNode();
    }
}, properties);
