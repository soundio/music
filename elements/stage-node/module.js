

import 'form/file-menu/module.js';

import Signal  from 'fn/signal.js';
import events  from 'dom/events.js';
import element from 'dom/element.js';
import createObjectProperty from 'dom/element/create-object-property.js';
import { dragstart, dragend }        from '../../../bolt/attributes/data-draggable.js';
import { dragenter, dragover, drop } from '../../../bolt/attributes/data-droppable.js';
import { nodes }        from '../../modules/events-node.js';


const assign = Object.assign;


/* Element */

export const lifecycle = {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.stageNodeStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4></h4>
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
        <file-menu prefix="harmoniser/" title="Settings"></file-menu>
    `,

    construct: function(shadow, internals) {
        const title      = shadow.querySelector('h4');
        const menu       = shadow.querySelector('file-menu');
        const inputsSVG  = shadow.querySelector('.inputs-svg');
        const outputsSVG = shadow.querySelector('.outputs-svg');
        const node       = this.node;

        if (node.inputs.size) {
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
                const input = this.node.input(e.target.dataset.index);
                if (!input) throw new Error('Drop target has no input at index ' + e.target.dataset.index);

                // Pipe output t't'input
                output.pipe(input);
                console.log('Piped node ' + node.id + ' output ' + data.index + ' to node ' + this.node.id + ' input ' + e.target.dataset.index);
            });
        }

        if (node.outputs.size) {
            events('dragstart', shadow).each(dragstart);
            events('dragend', shadow).each(dragend);
        }

        /* Set node as this.node */
        Signal.frame(() => {
            const node = this.node;
            if (!node) return;

            title.textContent = node.constructor.name;

            if (menu) {
                menu.prefix = node.constructor.name;
                menu.data   = node.data;
            }

            if (inputsSVG) {
                let i = -1;
                let html = '';
                while (++i < node.inputs.size) html += `<use href="#input-g" x="${ i * 12 }" y="0" part="input-${ i }" draggable="false" data-input-id="${ node.id }" data-input-index="${ i }" title="Output ${ i }" data-droppable="application/json">
                    <title>Input ${ i }</title>
                </use>`;
                inputsSVG.setAttribute('width', i * 12);
                inputsSVG.setAttribute('viewBox', `0 0 ${ i * 12 } 18`);
                inputsSVG.innerHTML += html;
            }

            if (outputsSVG) {
                let o = -1;
                let html = '';
                while (++o < node.outputs.size) html += `<use href="#output-g" x="${ o * 12 }" y="0" part="output-${ o }" draggable="true" data-output-id="${ node.id }" data-output-index="${ o }" title="Output ${ o }" data-draggable='application/json:{"type":"output","node":${ node.id },"index":${ o }};'>
                    <title>Output ${ o }</title>
                </use>`;
                outputsSVG.setAttribute('width', o * 12);
                outputsSVG.setAttribute('viewBox', `0 0 ${ o * 12 } 18`);
                outputsSVG.innerHTML += html;
            }
        });

        if (menu) {
            Signal.frame(() => {
                const node = this.node;
                if (!node) return;
                if (!menu.data) return;
                node.data = menu.data;
            });
        }
    },

    connect: function(shadow, internals, data) {
        return [
            Signal.tick(() => this.dataset.node = this.node.id)
        ];
    }
};

export const properties = {
    input: function(i = 0) {
        return this.node.input(i);
    },

    output: function(o = 0) {
        return this.node.output(o);
    },

    node: createObjectProperty()
};

export default element('<stage-node>', lifecycle, properties);
