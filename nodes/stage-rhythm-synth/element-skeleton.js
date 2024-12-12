/** <stage-rhythm-synth> **/

import RotaryInput  from 'form/rotary-input/element.js';

import delegate     from 'dom/delegate.js';
import element      from 'dom/element.js';
import events       from 'dom/events.js';
import Signal       from 'fn/signal.js';
import Literal      from 'literal/module.js';
import presets      from './presets.js';
import { shadow, construct, connect, properties } from '../stage-node/module.js';


const assign = Object.assign;


// Extend Literal scope
import * as consts from 'form/modules/constants.js';
assign(Literal.scope, consts);


// Templates

const literal = Literal.compileHTML('harmonic', `
    <input class="y3 mono-input $\{ 'bong' }" name="xxxx">
    <rotary-input class="y3 mono-input $\{ 'bong' }" name="xxxx"></rotary-input>
`);

export default element('<element-skeleton>', {
    mode: 'open',

    // Extend StageNode's `shadow`
    shadow: shadow + `
        <link rel="stylesheet" href="${ window.rhythmSynthStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>Rhythm Synth</h4>
        <div class="block" id="ui">Plugin UI goes here</div>
    `,

    construct: function(shadow, internals) {
        //construct.apply(this, arguments);

        //const menu = shadow.querySelector('file-menu');

        // Assign to internals
        assign(internals, {
            ui: shadow.getElementById('ui'),
            consts: { shadow, host: this }
        });

        // Add presets to settings menu
        //presets.forEach((preset) => menu.createPreset(preset.name, preset));

        // Listen for interaction
        events('input', shadow).each(delegate({
            '[name="xxxx"]': (input, e) => console.log(e.type, input)
        }));
    },

    connect: function(shadow, { canvas, ctx, box, consts, renderers, ui }) {
        connect.apply(this, arguments);

        // Where node is not yet defined give element node
        //if (!this.node) this.node = new StageNode();

        // First render
        const renderer = literal.render(shadow, consts, { node: this.node });

        // Append
        ui.append(renderer.content);

        // Return array of renderers and signal observers, and anything else
        // with a .stop() method – they are stopped on disconnect
        return [
            renderer,
            Signal.frame(() => {})
        ];
    }
}, properties);
