import assignAttributes from 'dom/assign.js';
import create           from 'dom/create.js';
import delegate         from 'dom/delegate.js';
import events           from 'dom/events.js';
import keyboard         from 'dom/keyboard.js';
import Data             from 'fn/data.js';
import get              from 'fn/get.js';
import Signal           from 'fn/signal.js';
import Stream           from 'fn/stream/stream.js';
import overload         from 'fn/overload.js';
import toCartesian      from 'fn/vector/to-cartesian-2d.js';
import element          from 'dom/element.js';
import createNumberProperty from 'dom/element/create-number-property.js';
import { frequencyToFloat }       from 'midi/frequency.js';
import { int7ToFloat }            from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import Event, { isNoteStart, isNoteStop } from '../../../soundstage/modules/event.js';
import { lifecycle, properties } from '../stage-node/module.js';
import EventsHarmoniser  from '../../modules/events-harmoniser.js';
import notesOptions from '../html/notes-options.js';

const assign = Object.assign;
//const push   = Stream.prototype.push;
//const symbol = Symbol('notes');

const whiteWidth = 12 / 7;
const gap = 0.0625;
const keysizes = {
    0:  { x1: 0 * whiteWidth + gap, x2: 1 * whiteWidth - gap },
    2:  { x1: 1 * whiteWidth + gap, x2: 2 * whiteWidth - gap },
    4:  { x1: 2 * whiteWidth + gap, x2: 3 * whiteWidth - gap },
    5:  { x1: 3 * whiteWidth + gap, x2: 4 * whiteWidth - gap },
    7:  { x1: 4 * whiteWidth + gap, x2: 5 * whiteWidth - gap },
    9:  { x1: 5 * whiteWidth + gap, x2: 6 * whiteWidth - gap },
    11: { x1: 6 * whiteWidth + gap, x2: 7 * whiteWidth - gap }
};

/* Functions */

function selectHarmonies(host, svg, harmonies, number) {
    /* TEMP */
    svg.querySelectorAll('[data-harmony]').forEach((path) => delete path.dataset.harmony);

    /* Selected note and harmonies */
    harmonies = host.data[number] || (host.data[number] = [number]);

    /* TEMP */
    harmonies.forEach((number, i) => svg.querySelector('[data-number="' + number + '"]').dataset.harmony = i);
}

function pushToOutputs(outputs, number, i) {
    if (outputs[i]) {
        const event = Event.note(number, 0.5, 0.2);
        outputs[i].push(event);
    }
    return outputs;
}

export default element('<event-harmoniser>', {
    mode: 'open',

    shadow: lifecycle.shadow + `
        <link rel="stylesheet" href="${ window.eventHarmoniserStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <form>
            <label for="min">min</label>
            <select name="min">${ notesOptions }</select>
            <label for="max">max</label>
            <select name="max">${ notesOptions }</select>
            <label for="transpose">transpose</label>
            <input type="number" name="transpose" value="0" min="-12" max="12" id="transpose"/>
        </form>
        <svg viewbox="0 0 128 10" id="svg"></svg>
    `,

    construct: function(shadow, internals) {
        // Is this the best place to do this?
        this.node = new EventsHarmoniser();
        lifecycle.construct.apply(this, arguments);

        const svg = shadow.getElementById('svg');

        internals.events = [];

        events('input', shadow).each(overload((e) => e.target.name, {
            'min':       (e) => this.min = parseInt(e.target.value, 10),
            'max':       (e) => this.max = parseInt(e.target.value, 10),
            'transpose': (e) => this.transpose = parseInt(e.target.value, 10)
        }));

        /*
        events('pointerdown', shadow).each(delegate({
            '[data-number]': (path, e) => {
                const number = parseInt(path.dataset.number, 10);
                push.call(this, Event.noteon(number));

                const up = events('pointerup', document)
                .each((e) => {
                    push.call(this, Event.noteoff(number))
                    up.stop();
                });
            }
        }));
        */

        events('pointerdown', shadow).each(delegate({
            '[data-number]': (path, e) => {
                const number    = parseInt(path.dataset.number, 10);
                const harmonies = internals.harmonies;
console.log(number);
                if (e.shiftKey) {
                    if (!harmonies) return;

                    harmonies.push(number);
                    selectHarmonies(this, svg, harmonies, internals.harmonies[0]);

                    // Push settings
                    harmonies.reduce(pushToOutputs, this.node.outputs);
                    return;
                }

                /* TEMP */
                selectHarmonies(this, svg, harmonies, number);
            }
        }));

        keyboard({
            'left:down':  (e) => {
                if (!internals.harmonies) return;
                selectHarmonies(this, svg, internals.harmonies, internals.harmonies[0] - 1);
            },

            'right:down': (e) => {
                if (!internals.harmonies) return;
                selectHarmonies(this, svg, internals.harmonies, internals.harmonies[0] + 1);
            }
        }, document.body);
    },

    connect: function(shadow, internals, data) {
        lifecycle.connect.apply(this, arguments);

        const min       = shadow.querySelector('[name="min"]');
        const max       = shadow.querySelector('[name="max"]');
        const transpose = shadow.querySelector('[name="transpose"]');
        const svg       = shadow.getElementById('svg');

        return [
            Signal.frame(() => {
                min.value = this.min;
                max.value = this.max;
                svg.setAttribute('viewBox', `0 0 ${ this.max - this.min } 10`);
            }),
            Signal.frame(() => transpose.value = this.transpose),
            Signal.frame(() => {
                // Read signals
                const min       = this.min;
                const range     = this.max - min;
                const transpose = this.transpose;

                // Render
                svg.innerHTML = Array.from({ length: range }).map((v, n) => {
                    const number = min + n + transpose;
                    const octave = Math.floor(number / 12) * 12 - min - transpose;
                    return [1,3,6,8,10].includes(number % 12) ?
                        `<path class="black-key" data-number="${ min + n }" data-pitch="${ toNoteName(min + n) }" d="M${ n },0 L${ n + 1 },0 L${ n + 1 },6 L${ n },6 Z"></path>` :
                        `<path class="white-key" data-number="${ min + n }" data-pitch="${ toNoteName(min + n) }" d="M${ octave + keysizes[number % 12].x1 },${ 6 + gap } L${ number % 12 === 5 ? octave + keysizes[number % 12].x1 : n + gap },${ 6 + gap } L${ number % 12 === 5 ? octave + keysizes[number % 12].x1 : n + gap },0 L${ number % 12 === 4 ? octave + keysizes[number % 12].x2 : n + 1 - gap },0 L${ number % 12 === 4 ? octave + keysizes[number % 12].x2 : n + 1 - gap },${ 6 + gap } L${ octave + keysizes[number % 12].x2 },${ 6 + gap } L${ octave + keysizes[number % 12].x2 },10 L${ octave + keysizes[number % 12].x1 },10 Z"></path>` ;
                }).join('');
            })
        ];
    }
}, assign({
    min:       createNumberProperty(0, 128, 24),
    max:       createNumberProperty(0, 128, 96),
    transpose: createNumberProperty(-12, 12, 0)
}, properties), 'piano-keyboard');
