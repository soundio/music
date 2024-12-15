
import Menu        from 'forms/file-menu/module.js';
import NormalInput from 'forms/normal-input/element.js';
import RotaryInput from 'forms/rotary-input/element.js';

import Data     from 'fn/data.js';
import get      from 'fn/get.js';
import overload from 'fn/overload.js';
import Signal   from 'fn/signal.js';
import events   from 'dom/events.js';
import element  from 'dom/element.js';
import { createProperty } from 'dom/element/create-attribute.js';
import { dragstart, dragend }        from '../../../bolt/attributes/data-draggable.js';
import { dragenter, dragover, drop } from '../../../bolt/attributes/data-droppable.js';
import { nodes }        from '../../modules/graph-node.js';


const assign = Object.assign;
window.Data = Data;

/* Element */

export const lifecycle = {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.stageNodeStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <svg class="inputs-svg" viewbox="0 0 12 18" width="12" height="18">
            <defs>
                <g id="input-g">
                    <circle cx="6" cy="9" r="4"></circle>
                    <line x1="6" y1="13" x2="6" y2="18"></line>
                </g>
            </defs>
        </svg>
        <svg class="outputs-svg" viewbox="0 0 12 18" width="12" height="18">
            <defs>
                <g id="output-g">
                    <circle cx="6" cy="9" r="4"></circle>
                    <line x1="6" y1="0" x2="6" y2="5"></line>
                </g>
            </defs>
        </svg>
        <h4></h4>
        <file-menu title="Settings">
            <hr/>
            <option value disabled>Actions</option>
            <option value="$remove">Remove</option>
        </file-menu>
    `,

    construct: function(shadow, internals) {
        const title      = shadow.querySelector('h4');
        const menu       = shadow.querySelector('file-menu');
        const inputsSVG  = shadow.querySelector('.inputs-svg');
        const outputsSVG = shadow.querySelector('.outputs-svg');

        const $node = internals.$node = Signal.of();

        if (menu) {
            // Namespace things the menu stores with the name of the element
            menu.prefix = this.tagName.toLowerCase() + '/';

            // This is a bit of a dodgy way of adding actions, it may
            // change in file-menu element
            menu.actions = {
                $remove: () => {
                    this.node.stop();
                    this.remove();
                }
            };
        }

        /* Set node as this.node */
        Signal.observe(internals.$node, (node) => {
            if (!node) return;

            this.dataset.node = this.node.id;
            this.node.style = this.style;

            // TODO: if node is changed (it isn't, but if it is) more handlers
            // will be registered
            if (node && node.inputs.size) {
                events('dragenter', shadow).each(dragenter);
                events('dragover', shadow).each(dragover);
                events('drop', shadow).each(drop);
                events('dropped', shadow).each((e) => {
                    const data = e.detail;
                    if (!data) throw new Error('Drop event has no data');
                    const node = nodes.find((node) => node.id === data.node);
                    if (!node) throw new Error('Dropped data has no .node id, or id is not in nodes registry');
                    const output = node.output(data.index);
                    if (!output) throw new Error('Dropped data has no .output index, or index is not in node.output(index)');
                    const input = this.node.input(e.target.dataset.inputIndex);
                    if (!input) throw new Error('Drop target has no input at index ' + e.target.dataset.inputIndex);

                    // Pipe output t't'input
                    output.pipe(input);
console.log('Piped node ' + node.id + ' output ' + data.index + ' to node ' + this.node.id + ' input ' + e.target.dataset.inputIndex);
                });
            }

            if (node && node.outputs.size) {
                events('dragstart', shadow).each(dragstart);
                events('dragend', shadow).each(dragend);
            }
        });

        Signal.frame(() => {
            const node = this.node;
            if (!node) return;

            title.textContent = node.type;

            if (menu) {
                menu.prefix = node.type;
                // Beware not all nodes have, or should have, .data
                if (node.data) menu.data = node.data;
            }

            if (inputsSVG) {
                let i = -1;
                let html = '';
                while (++i < node.inputs.size) html += `<use href="#input-g" x="${ i * 12 }" y="0" part="input-${ i }" draggable="false" data-input-id="${ node.id }" data-input-index="${ i }" title="Output ${ i }" data-droppable="application/json">
                    <title>${ node.inputs.names ? node.inputs.names[i] : 'Input ' + i }</title>
                </use>`;
                inputsSVG.setAttribute('width', i * 12);
                inputsSVG.setAttribute('viewBox', `0 0 ${ i * 12 } 18`);
                inputsSVG.innerHTML += html;
            }

            if (outputsSVG) {
                let o = -1;
                let html = '';
                while (++o < node.outputs.size) html += `<use href="#output-g" x="${ o * 12 }" y="0" part="output-${ o }" draggable="true" data-output-id="${ node.id }" data-output-index="${ o }" title="Output ${ o }" data-draggable='application/json:{"type":"output","node":${ node.id },"index":${ o }};'>
                    <title>${ node.outputs.names ? node.outputs.names[o] : 'Output ' + o }</title>
                </use>`;
                outputsSVG.setAttribute('width', o * 12);
                outputsSVG.setAttribute('viewBox', `0 0 ${ o * 12 } 18`);
                outputsSVG.innerHTML += html;
            }
        });

        if (menu) {
            events('change', menu).each((e) => {
                if (window.DEBUG) console.trace('Setting', e.target.data);

                // TEMP. Not necesssary but we dbugging right npw
                if (!e.target.data) return;
                assign(Data.of(this.node), e.target.data);
            });

            Signal.frame(() => {
                const node = this.node;
                if (!node) return;
                if (!menu.data) return;
                node.data = menu.data;
            });
        }

        // Safari does not support customised built-ins but the element()
        // function provides a partial polyfill. This does nothing in browsers
        // that do have support.
        NormalInput.polyfillByRoot(shadow);
        RotaryInput.polyfillByRoot(shadow);
    },

    connect: function(shadow, internals, data) {

    }
};

export const properties = {
    input: {
        value: function(i = 0) {
            if (!this.node) throw new Error('Element has no graph node');
            return this.node.input(i);
        }
    },

    output: {
        value: function(o = 0) {
            if (!this.node) throw new Error('Element has no graph node');
            return this.node.output(o);
        }
    },

    node: createProperty('node', undefined, Data.objectOf)
};

export default element('<stage-node>', lifecycle, properties);

// Helpful exports for building stage elements
export const shadow    = lifecycle.shadow;
export const construct = lifecycle.construct;
export const connect   = lifecycle.connect;
