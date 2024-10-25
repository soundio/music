

import 'form/file-menu/module.js';

import clamp    from 'fn/clamp.js';
import matches  from 'fn/matches.js';
import Signal   from 'fn/signal.js';
import Stream   from 'fn/stream/stream.js';
import create   from 'dom/create.js';
import delegate from 'dom/delegate.js';
import events   from 'dom/events.js';
import gestures from 'dom/gestures.js';
import rect     from 'dom/rect.js';
import style    from 'dom/style.js';
import element, { getInternals } from 'dom/element.js';
import { createObjectAttribute } from 'dom/element/create-attribute.js';
import { dragstart, dragend }        from '../../../bolt/attributes/data-draggable.js';
import { dragenter, dragover, drop } from '../../../bolt/attributes/data-droppable.js';
import { nodes }        from '../../modules/events-node.js';


const assign = Object.assign;


/* Transparent 1px canvas for overriding drag image. Must be in the DOM
   on dragstart. */
const pxCanvas = create('canvas', { class: 'px-canvas', width: 1, height: 1 });
const ctx      = pxCanvas.getContext('2d');
ctx.fillStyle = "rgba(0,0,0,0.01)";
ctx.fillRect(0, 0, 1, 1);
document.body.appendChild(pxCanvas);
/* */


function findNode(id) {
    return nodes.find(matches({ id: parseInt(id, 10) }));
}

function getOutputFromDataset(element) {
    const { outputId, outputIndex } = element.dataset;
    const outputNode = findNode(outputId);
    return outputNode.output(outputIndex);
}

function getInputFromDataset(element) {
    const { inputId, inputIndex } = element.dataset;
    const inputNode  = findNode(inputId);
    return inputNode.input(inputIndex);
}

function empty(element) {
    while (element.firstChild) element.firstChild.remove();
}

function nodePartToBox(parent, node, part) {
    const element = parent.querySelector('[data-node="' + node.id + '"]:not(.cable-path)');
    if (!element) throw new Error('Node element data-node="' + node.id + '" does not exist');

    const shadow = element.shadowRoot;
    if (!shadow) throw new Error('Node shadow does not exist', element);

    const elem = shadow.querySelector('[part="' + part + '"]');
    if (!elem) throw new Error('Node part="' + part + '" does not exist', element);

    return rect(elem);
}

function drawCables(element, cablesElement, output, n) {
    const source    = output.node;
    const sourceBox = nodePartToBox(element, source, 'output-' + n);
    const sourceX   = sourceBox.left + 0.5 * sourceBox.width;
    const sourceY   = sourceBox.top + sourceBox.height;

    let o = -1;
    while (output[++o]) {
        const target = output[o].node;

        // If someone has programmatically piped this output to an
        // arbitrary stream rather than a graph node input, it will not
        // have a .node property. Ignore. TODO: should we show these somehow?
        if (!target) continue;
        const inputs = target.inputs;

        // Find input index
        let index;
        for (index in inputs) if (inputs[index] === output[o]) break;
console.log('Drawing ' + source.id + '.output(' + n + ') to ' + target.id + '.input(' + index + ')');
        const targetBox = nodePartToBox(element, target, 'input-' + index);
        const targetX   = targetBox.left + 0.5 * targetBox.width;
        const targetY   = targetBox.top;
        const diffX     = targetX - sourceX;
        const diffY     = targetY - sourceY;

        const d = 'M' + sourceX + ',' + sourceY
            + 'C' + sourceX + ',' + (sourceY + Math.max(diffY * 0.666667, 30))
            + ',' + targetX + ',' + (targetY - Math.max(diffY * 0.666667, 30))
            + ',' + targetX + ',' + targetY ;

        cablesElement.appendChild(
            create('path', {
                class: 'cable-path',
                d,
                draggable: 'true',
                data: {
                    draggable: 'application/json:' + JSON.stringify({
                        type:  'output',
                        node:  source.id,
                        index: n
                    }),
                    outputId:    source.id,
                    outputIndex: n,
                    inputId:     target.id,
                    inputIndex:  index
                }
            })
        );
    }
}

function drawOutputs(element, cablesElement, node) {
    const outputs = node.outputs;

    let n;
    for (n in outputs) {
        // Ignore inputs or outputs size and names properties - TODO: make it unenumerable??
        if (!/^\d/.test(n)) continue;
        drawCables(element, cablesElement, outputs[n], parseInt(n, 10));
    }
}

function updateCables(element, cablesElement) {
console.group('Draw');
    empty(cablesElement);
    element.querySelectorAll('[data-node]').forEach((child) => drawOutputs(element, cablesElement, child.node));
console.groupEnd();
}


/* Element */

const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
        console.log('resize', entry.target);
        const element       = entry.target;
        const cablesElement = getInternals(element).cablesElement;
        updateCables(element, cablesElement);
    }
});

export const lifecycle = {
    shadow: `
        <link rel="stylesheet" href="${ window.nodeGraphStylesheet || import.meta.url.replace(/module.js$/, 'shadow.css') }"/>
        <svg viewbox="0 0 1 1" width="1" height="1">
            <g id="cables"></g>
        </svg>
        <slot></slot>
    `,

    construct: function(shadow, internals) {
        const cablesElement = internals.cablesElement = shadow.getElementById('cables');

        /* Drag n drop */
        let dragGhost, dragOffset;

        events('dragstart', this).each((e) => {
            const path = e.composedPath();

            if (e.altKey) console.log('TODO: copy');

            // Ignore gestures in form controls
            if (path[0].closest('[draggable="false"]') || path[0].form || ('name' in path[0] && 'value' in path[0])) {
                console.log('No drag');
                // TODO: Does this stop drags from internal things tho? Like outputs?
                e.preventDefault();
                return;
            }

            const element = path.find((node) => node.getAttribute && node.getAttribute('draggable'));

        /*
            if (element.getRootNode() !== document) {
                // TODO: Does this stop drags from internal things tho? Like outputs?
                e.preventDefault();
                return;
            }
        */

            if (element.dataset.outputIndex) {
                // Hide drag image
                e.dataTransfer.setDragImage(pxCanvas, 1, 1);

                // Dragging a cable
                if (element.matches('.cable-path')) {
                    const output = getOutputFromDataset(element);
                    const input  = getInputFromDataset(element);

                    // Disconnect input from output
                    Stream.unpipe(output, input);
                    delete element.dataset.inputId;
                    delete element.dataset.inputIndex;

                    dragGhost = element;
                    return;
                }

                // Dragging an output contact, create a cable path
                const json = e.dataTransfer.getData('application/json');
                if (!json) return;

                const data       = JSON.parse(json);
                const outputNode = nodes.find(matches({ id: data.node }));
                const outputBox  = nodePartToBox(graph, outputNode, 'output-' + data.index);
                const outputX    = outputBox.left + 0.5 * outputBox.width;
                const outputY    = outputBox.top + outputBox.height;
                const diffY      = e.pageY - outputY;

                // Dragging a contact
                dragGhost = create('path', {
                    class: 'cable-path',

                    d: 'M' + outputX + ',' + outputY
                        + 'C' + outputX + ',' + (outputY + Math.max(diffY * 0.666667, 30))
                        + ',' + e.pageX + ',' + (e.pageY - Math.max(diffY * 0.666667, 30))
                        + ',' + e.pageX + ',' + e.pageY,

                    draggable: 'true',

                    data: {
                        draggable:   'application/json:' + JSON.stringify(data),
                        outputId:    data.node,
                        outputIndex: data.index
                    }
                });

                cablesElement.appendChild(dragGhost);
                return;
            }

            // Dragging a node UI
            const box = rect(element);
            dragOffset = { x: e.clientX - box.left, y: e.clientY - box.top };
            dragGhost  = element;
        });

        events('dragover', this).each((e) => {
            //const data = e.dataTransfer.getData('text/plain');
            //console.log('dragover', data);
            if (!dragGhost) return;

            if (dragGhost.dataset.outputId) {
                // Dragging an output path or connect, which was given a path
                // in dragstart
                const box   = rect(graph);
                const d     = dragGhost.getAttribute('d').split(',');
                const y1    = parseFloat(d[1]);
                const y2    = e.pageY;
                const diffY = y2 - y1;

                d[3] = d[5] = e.pageX;
                d[2] = y1 + Math.max(diffY * 0.666667, 30);
                d[4] = y2 - Math.max(diffY * 0.666667, 30);
                d[6] = y2;

                dragGhost.setAttribute('d', d.join(','));
                return;
            }

            // Dragging a node UI
            const box   = rect(graph);
            const xgap  = style('column-gap', graph);
            const ygap  = style('row-gap', graph);
            const x = clamp(0, Infinity, Math.round((e.clientX - box.left - dragOffset.x) / xgap));
            const y = clamp(0, Infinity, Math.round((e.clientY - box.top - dragOffset.y) / ygap));

            dragGhost.style['grid-column-start'] = x + 1;
            dragGhost.style['grid-row-start'] = y + 1;

            requestAnimationFrame(updateCables);
        });

        events('dragend', this).each((e) => {
            dragOffset = undefined;
            dragGhost  = undefined;
            requestAnimationFrame(updateCables);
        });

        // Respond to size changes
        events('slotchange', shadow).each((e) => {
            console.log(e.type, e.target);
            updateCables(this, cablesElement)
        });

        resizeObserver.observe(this);
    },

    connect: function(shadow, internals) {
        const cablesElement = internals.cablesElement;

        //updateCables(this, cablesElement);
        //events('resize', window).each(() => updateCables(this, cablesElement));
    }
};

export const properties = {
    input: function(i = 0) {

    },

    output: function(o = 0) {

    }
};

export default element('<node-graph>', lifecycle, properties);
