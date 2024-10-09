
import FileMenu from 'form/file-menu/module.js';

import delegate         from 'dom/delegate.js';
import events           from 'dom/events.js';
import Data             from 'fn/data.js';
import get              from 'fn/get.js';
import Stream           from 'fn/stream/stream.js';
import overload         from 'fn/overload.js';
import element, { getInternals, render }  from 'dom/element-2.js';
import { dragstart, dragend } from '../../../bolt/attributes/data-draggable.js';
import { dragenter, dragover, drop } from '../../../bolt/attributes/data-droppable.js';
import { nodes }        from '../../modules/events-node.js';


const assign = Object.assign;


/* Element */

export const lifecycle = {
    mode: 'open',

    shadow: `
        <link rel="stylesheet" href="${ window.stageNodeStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4></h4>
        <ul class="inputs-ol"></ul>
        <ul class="outputs-ol"></ul>
        <file-menu prefix="harmoniser/" title="Settings"></file-menu>
    `,

    construct: function(shadow, internals) {
        const title     = shadow.querySelector('h4');
        const menu      = shadow.querySelector('file-menu');
        const inputsOl  = shadow.querySelector('.inputs-ol');
        const outputsOl = shadow.querySelector('.outputs-ol');
        const node      = this.node;

        if (node.inputs.size) {
            events('dragenter', shadow).each(dragenter);
            events('dragover', shadow).each(dragover);
            events('drop', shadow).each(drop);
            events('dropped', shadow).each((e) => {
                const data = e.detail;
                if (!data) throw new Error('Dropped data has no data');
                const node = nodes.find((node) => node.id === data.node);
                if (!node) throw new Error('Dropped data has no .node id, or id is not in nodes registry');
                const output = node.output(data.output);
                if (!output) throw new Error('Dropped data has no .output index, or index is not in node.output(index)');
                const input = this.node.input(e.target.dataset.index);
                if (!input) throw new Error('Drop target has no input at index ' + e.target.dataset.index);

                // Pipe output t't'input
                output.pipe(input);
                console.log('Piped node ' + node.id + ' output ' + data.output + ' to node ' + this.node.id + ' input ' + e.target.dataset.index);
            });
        }

        if (node.outputs.size) {
            events('dragstart', shadow).each(dragstart);
            events('dragend', shadow).each(dragend);
        }

        /* Set node as this.node */
        render(() => {
            const node = this.node;
            if (!node) return;

            title.textContent = node.constructor.name;
            menu.prefix = node.constructor.name;
            menu.data   = node.data;

            let i = -1;
            let html = '';
            while (++i < node.inputs.size) html += `<li class="input-li" draggable="false" data-droppable="application/json" part="input-${ i }" data-node="${ node.id }" data-index="${ i }" title="Input ${ i }">${ i }</li>`;
            inputsOl.innerHTML = html;

            let o = -1;
            html = '';
            while (++o < node.outputs.size) html += `<li class="output-li" draggable="true" data-draggable='application/json:{"type":"output","node":${ node.id },"output":${ o }};' part="output-${ o }" data-node="${ node.id }" data-index="${ o }" title="Output ${ o }">${ o }</li>`;
            outputsOl.innerHTML = html;
        });

        render(() => {
            const node = this.node;
            if (!node) return;
            if (!menu.data) return;
            node.data = menu.data;
        });
    },

    connect: function(shadow, internals, data) {
        return [
            render(() => this.dataset.node = this.node.id)
        ];
    }
};

export const properties = {
    input: {
        value: function(i = 0) {
            return this.node.input(i);
        }
    },

    output: {
        value: function(o = 0) {
            return this.node.output(o);
        }
    },

    node: {
        type: 'property'
    }
};

export default element('<stage-node>', lifecycle, properties);
