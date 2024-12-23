/** <stage-audio> **/

import delegate    from 'dom/delegate.js';
import element     from 'dom/element.js';
import events      from 'dom/events.js';
import Signal      from 'fn/signal.js';
import Literal     from 'literal/module.js';
import { isParam } from '../../modules/param.js';
import StageObject from './object.js';

import { shadow, construct, connect, properties } from '../stage-node/element.js';
import nodeTemplate from '../../templates/node.js';
import * as templates from '../../templates/node.js';


// Extend Literal scope
import 'literal/scope.js';
import dB     from 'fn/to-db.js';
import toGain from 'fn/to-gain.js';

const assign = Object.assign;
assign(Literal.scope, { dB, toGain });


// Extend Literal scope
import * as consts from 'forms/modules/constants.js';
assign(Literal.scope, consts);

/*
// Templates
Literal.compileHTML('param-pan',  '<input type="range" is="normal-input" name="pan" min="-1" max="1" step="any" value="${ 0 }" class="pan-input ${ DATA.class }" />');
Literal.compileHTML('param-gain', '<input type="range" is="normal-input" name="gain" min="0" max="${ toGain(12) }" law="log-36db" step="any" value="${ 1 }" class="fader-input vertical ${ DATA.class }" />');
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
*/

export default element('<stage-audio>', {
    mode: 'open',

    // Extend StageNode's `shadow`
    shadow: shadow + `
        <link rel="stylesheet" href="${ window.stageAudioStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <div class="ui-block block" id="ui"></div>
    `,

    construct: function(shadow, internals) {
        construct.apply(this, arguments);

        const menu = shadow.querySelector('file-menu');

        // Assign to internals
        assign(internals, {
            ui: shadow.getElementById('ui'),
            consts: { shadow, host: this }
        });

        // OPTION-mousedown on an input resets param value to 0
        events({ type: 'mousedown', modifiers: 'alt', select: 'input' }, shadow).each((e) => {
            const audioNode = this.object.data;
            // It is possible we are not initialised, but we really ought to
            // avoid this state, so this is just a safety check
            if (!audioNode) return;

            const name  = e.target.name;
            const param = audioNode[name];
            if (typeof param === 'object'&& isParam(param)) {
                // Instead of 0 we should get default value from config??
                param.linearRampToValueAtTime(0, audioNode.context.currentTime + 0.004);
                // Notify signal of changes
                if (param.signal) {
                    //param.signal.invalidate();
                    // Sometimes that was too quick for the .value of the param
                    // to have updated - maybe we have clicked near to a frame,
                    // and the value doesn't update until the next 128 sample
                    // block, so cue it again
                    requestAnimationFrame(() => param.signal.invalidate());
                }
            }
        });

        let voice;
        events({ type: 'mousedown mouseup', select: '[name="startstop"]' }, shadow).each((e) => {
            const node = this.object.data;
            // It is possible we are not initialised, but we really ought to
            // avoid this state, so this is just a safety check
            if (!node) return;

            if (e.type === 'mousedown') voice = node.start();
            else voice && voice.stop();
        });

        // Listen for interaction
        events('input', shadow).each((e) => {
            const audioNode = this.object.data;

            // It is possible we are not initialised, but we really ought to
            // avoid this state, so this is just a safety check
            if (!audioNode) return;

            const input = e.target;
            const name  = input.name;
            const type  = input.type;
            const value = (type === 'range' || type === 'number') ?
                // We are observing an augmented input element like is="normal-input"
                // that publishes its value as a number. Use directly.
                typeof input.value === 'number' ? input.value :
                // Parse to number
                input.valueAsNumber || parseFloat(input.value) :
                // Use checkbox value if not the standard 'on', otherwise boolean
                // from .checked
                type === 'checkbox' ?
                    input.value && input.value !== 'on' ?
                        input.checked ?
                            input.value :
                        undefined :
                    input.checked :
                // Its a select or radio, use its string
                input.value ;

            const context = audioNode.context;
            const param   = audioNode[name];

            // All this stuff should be handled by soundstage.. look it up
            if (typeof param === 'object') {
                if (isParam(param)) {
                    // Value can only be numeric here, we should handle this sooner, mebbe around line 80??
                    if (value <= 0) param.linearRampToValueAtTime(value, audioNode.context.currentTime + 1/60);
                    else param.exponentialRampToValueAtTime(value, audioNode.context.currentTime + 1/60);
                    // Notify signal of changes
                    if (param.signal) param.signal.invalidate();
                }
                else {
                    // We set object like buffers and whatnot
                    audioNode[input.name] = value;
                }
            }
            else {
                Data.of(audioNode)[name] = value;
            }
        });
    },

    connect: function(shadow, { consts, ui }) {
        // Where node is not yet defined give element node
        if (!this.object) {
            console.log('<stage-object> .object not set, creating object');
            this.object = new StageObject();
        }

        connect.apply(this, arguments);

        // Choose template and render it
        // TEMP redirect for panner because export names can't have dashes
        const type = this.object.TYPE === 'stereo-panner' ? 'pan' : this.object.TYPE ;
        const template = templates[type] || templates.default;
        const renderer = template.render(shadow, consts, this.object.data );

        // Append rendered content
        ui.append(renderer.content);

        // Return array of renderers and signal observers, and anything else
        // with a .stop() method – to be stopped on element disconnect
        return [
            renderer,
            Signal.frame(() => {})
        ];
    }
}, properties);
