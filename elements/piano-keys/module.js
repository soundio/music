import assignAttributes from 'dom/assign.js';
import create           from 'dom/create.js';
import delegate         from 'dom/delegate.js';
import events           from 'dom/events.js';
import keyboard         from 'dom/keyboard.js';
import Renderer         from 'dom/element/renderer.js';
import Data             from 'fn/data.js';
import get              from 'fn/get.js';
import Signal           from 'fn/signal.js';
import Stream           from 'fn/stream/stream.js';
import overload         from 'fn/overload.js';
import toCartesian      from 'fn/vector/to-cartesian-2d.js';
import element, { getInternals, render }  from 'dom/element-2.js';
import { frequencyToFloat }       from 'midi/frequency.js';
import { int7ToFloat }            from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import Event, { isNoteStart, isNoteStop } from '../../../soundstage/modules/event.js';

const assign = Object.assign;
const push = Stream.prototype.push;
const symbol = Symbol('notes');

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

export default element('piano-keys', {
    shadow: `
        <link rel="stylesheet" href="./shadow.css" />
        <label for="transpose">transpose</label>
        <input type="number" name="transpose" value="0" min="-12" max="12" id="transpose"/>
        <svg viewbox="0 0 128 10" id="svg"></svg>
    `,

    construct: function(shadow, internals) {
        const svg     = shadow.querySelector('svg');
        const outputs = internals.outputs = {};

        internals.events = [];

        events('input', shadow).each(overload((e) => e.target.name, {
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

                if (e.shiftKey) {
                    if (!harmonies) return;

                    harmonies.push(number);
                    selectHarmonies(this, svg, harmonies, internals.harmonies[0]);

                    // Push settings
                    harmonies.reduce(pushToOutputs, outputs);
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
        const input = shadow.querySelector('input');
        const svg = shadow.querySelector('svg');

        return [
            render(() => svg.setAttribute('viewBox', `0 0 ${ this.max - this.min } 10`)),
            render(() => input.value = this.transpose),
            render(() => {
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
}, {
    min:       { type: 'number', min: 0,   max: 128, default: 24 },
    max:       { type: 'number', min: 0,   max: 128, default: 96 },
    transpose: { type: 'number', min: -12, max: 12,  default: 0 },

    data: {
        get: function() {
            const signal = this[symbol] || (this[symbol] = Signal.of());
            return signal.value;
        },

        set: function(value) {
            const signal = this[symbol] || (this[symbol] = Signal.of());
            signal.value = value;

            // TEMP
            const { harmonies, shadowRoot } = getInternals(this);
            const svg = shadowRoot.querySelector('svg');
            const currentNote = harmonies ? harmonies[0] : 69;
            selectHarmonies(this, svg, harmonies, currentNote);
        }
    },

    push: {
        value: overload(get(1), {
            noteon: function(noteon) {
                const { events, harmonies, shadowRoot } = getInternals(this);
                events.push(noteon);

                /* TEMP */
                const svg = shadowRoot.querySelector('svg');
                selectHarmonies(this, svg, harmonies, noteon[2]);
            },

            noteoff: function(noteoff) {
                const { events, outputs } = getInternals(this);

                // Remove matching note
                const i = events.findIndex((event) => isNoteStart(event) && event[2] === noteoff[2]);

                // No matching noteon found. Shouldn't happen unless something
                // got initialised while a note was on. Push it thru anyway.
                if (i === -1) {
                    push.call(this, noteoff);
                    return;
                }

                const noteon = events[i];
                if (noteon.sustained) noteon.sustained = 2;
                else events.splice(i, 1);
            },

            /*pitch: function(message) {
                const { notes, shadowRoot } = getInternals(this);
                const bend = this.range * toSignedFloat(message);

                let n = -1;
                let note, originalPitch;

                while (note = notes[++n]) if (toChannel(note.message) === toChannel(message)) {
                    const pitch = note.pitchStart + bend;
                    const oldPitch = Math.round(note.pitch);
                    const newPitch = Math.round(pitch);

                    note.pitch = pitch;

                    // TEMP. Move this
                    if (newPitch !== oldPitch) {
                        const svgRegions = shadowRoot.getElementById('regions');
                        svgRegions.querySelectorAll('.highlight').forEach((node) => node.classList.remove('highlight'));
                        notes.forEach((note) => svgRegions.querySelector('[data-pitch="' + toNoteName(Math.round(note.pitch)).replace(/\d/, ($0) => '-' + $0) + '"]').classList.add('highlight'));
                    }

                    // TEMP. Move this
                    const xy = numberToXY(note.pitch);
                    assignAttributes(note.element, { cx: xy[0], cy: xy[1] });
                };
            },*/

            default: push
        })
    },

    output: {
        value: function(n = 0) {
            const { outputs } = getInternals(this);
            return outputs[n] || (outputs[n] = Stream.broadcast({ hot: true }));
        }
    }
}, 'piano-keyboard');
