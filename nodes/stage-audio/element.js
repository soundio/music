/** <stage-audio> **/

/* Elements */
import NormalInput from 'form/normal-input/element.js';
import RotaryInput from 'form/rotary-input/element.js';

import delegate    from 'dom/delegate.js';
import element     from 'dom/element.js';
import events      from 'dom/events.js';
import Signal      from 'fn/signal.js';
import Literal     from 'literal/module.js';
import Module      from './module.js';
import presets     from './presets.js';
import { shadow, construct, connect, properties } from '../stage-node/module.js';


const assign = Object.assign;


// Extend Literal scope
import * as consts from 'form/modules/constants.js';
assign(Literal.scope, consts);


// Templates
Literal.compileHTML('param-pan',    '<input type="range" is="normal-input" name="pan" min="-1" max="1" step="any" value="${ 0 }" class="pan-input ${ DATA.class }" />');
Literal.compileHTML('param-gain',   '<input type="range" is="normal-input" name="gain" min="0" max="2" step="any" value="${ 1 }" class="fader-input ${ DATA.class }" />');
// TODO: This are not yet reading initial value of a param
Literal.compileHTML('button-char', `
    <input id="$\{ DATA.name }" type="checkbox" name="$\{ DATA.name }" checked="$\{ data.object[DATA.name] }" class="invisible" />
    <label for="$\{ DATA.name }" class="char-thumb thumb size-21 $\{ DATA.class }" data-char="$\{ DATA.char }">Mute</label>
`);

const literal = Literal.compileHTML('node-mix', `
    <div class="mix-grid grid">
        $\{ data.node.data && data.node.data.pan && include('param-pan', { param: data.node.data.pan }) }
        $\{ data.node.data && data.node.data.gain && include('param-gain', { param: data.node.data.gain }) }
        $\{ data.node.data && include('button-char', { object: {}, name: 'invert', char: 'ø', text: 'Invert phase' }) }
        $\{ data.node.data && include('button-char', { object: DATA.node.data, name: 'mute',   char: 'M', text: 'Mute' }) }
    </div>
`);


export default element('<stage-audio>', {
    mode: 'open',

    // Extend StageNode's `shadow`
    shadow: shadow + `
        <link rel="stylesheet" href="${ window.stageAudioStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <div class="block" id="ui"></div>
    `,

    construct: function(shadow, internals) {
        construct.apply(this, arguments);

        const menu = shadow.querySelector('file-menu');

        // Assign to internals
        assign(internals, {
            ui: shadow.getElementById('ui'),
            consts: { shadow, host: this }
        });

        // Add presets to settings menu
        presets.forEach((preset) => menu.createPreset(preset.name, preset));

        // Listen for interaction
        events('input', shadow).each((e) => {
            const audioNode = this.node.data;

            // It is possible we are not initialised, but we really ought to
            // avoid this state, so this is just a safety check
            if (!audioNode) return;

            const input = e.target;
            const name  = input.name;
            const type  = input.type;
            const value = (type === 'range' || type === 'number') ?
                input.valueAsNumber || parseFloat(input.value) :
                type === 'checkbox' ?
                    input.value && input.value !== 'on' ?
                        input.checked ?
                            input.value :
                        undefined :
                    input.checked :
                input.value ;

            const param = audioNode[name];

            // All this stuff should be handled by soundstage.. look it up
            if (typeof param === 'object') {
                if (param.setValueAtTime) {
                    // Value can only be numeric here, we should split this sooner
                    param.setValueAtTime(value, audioNode.context.currentTime);
                    // TODO We're gonna need to notify updates somehow
                    // ??? Data.notify(param);
                }
                else {
                    console.log('HUH? Is it a signal?', param);
                }
            }
            else {
                console.log(name, value);
                Data.of(audioNode)[name] = value;
            }
        });
    },

    connect: function(shadow, { canvas, ctx, box, consts, renderers, ui }) {
        connect.apply(this, arguments);

        // Where node is not yet defined give element node
        if (!this.node) this.node = new Module();

        // Render
        const renderer = literal.render(shadow, consts, { node: this.node });

        // Append rendered content
        ui.append(renderer.content);

        // Return array of renderers and signal observers, and anything else
        // with a .stop() method – they are stopped on disconnect
        return [
            renderer,
            Signal.frame(() => {})
        ];
    }
}, properties);
