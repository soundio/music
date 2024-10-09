import assignAttributes from 'dom/assign.js';
import create           from 'dom/create.js';
import Data             from 'fn/data.js';
import get              from 'fn/get.js';
import overload         from 'fn/overload.js';
import Stream           from 'fn/stream/stream.js';
import toCartesian      from 'fn/vector/to-cartesian-2d.js';
import element, { getInternals, render } from 'dom/element-2.js';
import { frequencyToFloat }       from 'midi/frequency.js';
import { int7ToFloat }            from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import { isNoteOn, isControl, toChannel, toType, toSignedFloat } from 'midi/message.js';
import { lifecycle, properties } from '../stage-node/module.js';
import EventsNode from '../../modules/events-node.js';


const assign = Object.assign;


/* Note tracking */

function Note(event) {
    this.start   = event;
    this.events  = [];
    this.pitch   = event[2];
    this.force   = event[3];
    this.sustain = 0;
}

assign(Note.prototype, {
    push: overload(get(1), {
        stop: function(event) {
            if (event[2] !== this.start[2]) {
                throw new Error('Pushing non-matching stop event to note [' + event.join(', ') + ']')
            }

            if (this.sustain) {
                // Move note to sustain state 2 to mark for removal when
                // sustain pedal is lifted
                this.sustain = 2;
            }

            this.stop = event;
        },

        param: overload(get(2), {
            pitch: function(event) {
                this.pitch = this.start[2] + event[3];
                this.events.push(event);
            },

            force: function(event) {
                this.force = event[3];
                this.events.push(event);
            },

            sustain: function(event) {
                this.sustain = event[3] ? 1 : 0;
                this.events.push(event);
            },

            default: (event) => console.log('Why are we trying to add this event to note?', event)
        }),

        default: (event) => console.log('Why are we trying to add this event to note?', event)
    })
});

assign(Note, {
    from: function(event) {
        return new Note(event);
    }
});

function removeNote(notes, i) {
    const element = notes[i].element;
    if (element) element.remove();
    Data.of(notes).splice(i, 1);
}


/* Harmony circle Functions */

function toDistance(n) {
    return (6 + Math.pow(n, 1.4)) / 15;
}

function numberToXY(n) {
    const angle    = (Math.PI * (n % 12) / 6) - (Math.PI / 2);
    const distance = toDistance(128 - n);
    return toCartesian([distance, angle]);
}

function numberToDA(n) {
    const angle    = (Math.PI * (n % 12) / 6) - (Math.PI / 2);
    const distance = 128 - n;
    return [distance, angle];
}

function numberToRegion(n) {
    const da1 = numberToDA(n - 0.5);
    const da2 = numberToDA(n + 0.5);
    return {
        p1: toCartesian([toDistance(da1[0] - 12), da1[1]]),
        p2: toCartesian([toDistance(da1[0]), da1[1]]),
        p3: toCartesian([toDistance(da2[0]), da2[1]]),
        p4: toCartesian([toDistance(da2[0] - 12), da2[1]])
    };
}

function noteToElement(note) {
    const xy = numberToXY(note.pitch);
    if (!note.element) note.element = create('circle', { style: 'fill: #444444;' });

    assignAttributes(note.element, {
        cx: xy[0],
        cy: xy[1],
        r: 0.5 + Math.sqrt(note.force) * 2.6
    });

    return note.element;
}


/* <note-radar> */

export default element('note-radar', {
    mode: 'open',

    shadow: lifecycle.shadow + `
        <link rel="stylesheet" href="${ window.noteRadarStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <svg viewbox="-52.5 -52.5 105 105" id="svg">
            <defs>
                <clipPath id="clip">
                    <circle cx="0" cy="0" r="52.5"></circle>
                </clipPath>
            </defs>
            <g clip-path="url(#clip)" id="regions"></g>
            <!--circle cx="0" cy="0" r="3" fill="white" /-->
            <g id="notes"></g>
        </svg>
    `,

    construct: function(shadow, internals, data) {
        const inputs = {
            0: new Stream.Each(overload(get(1), {
                start: (event) => {
                    const { notes } = getInternals(this);
                    Data.of(notes).push(Note.from(event));
                },

                stop: (event) => {
                    const { notes } = getInternals(this);

                    // Remove matching note
                    const i = notes.findIndex((note) => note.start[2] === event[2]);
                    if (i === -1) return;

                    const note = notes[i];
                    note.push(event);
                    if (!note.sustain) removeNote(notes, i);
                },

                param: overload(get(2), {
                    pitch: (event) => {
                        const { notes, shadowRoot } = getInternals(this);
                        //const bend = this.range * toSignedFloat(message);

                        let n = -1;
                        let note, originalPitch;

                        while (note = notes[++n]) {
                            const oldPitch = Math.round(note.pitch);
                            note.push(event);
                            const newPitch = Math.round(note.pitch);

                            // TEMP. Move this
                            if (newPitch !== oldPitch) {
                                const svgRegions = shadowRoot.getElementById('regions');
                                svgRegions.querySelectorAll('.highlight').forEach((node) => node.classList.remove('highlight'));
                                notes.forEach((note) => svgRegions.querySelector('[data-pitch="' + toNoteName(Math.round(note.pitch)).replace(/\d/, ($0) => '-' + $0) + '"]').classList.add('highlight'));
                            }

                            // TEMP. Move this
                            const xy = numberToXY(note.pitch);
                            assignAttributes(note.element, { cx: xy[0], cy: xy[1] });
                        }
                    },

                    sustain: (event) => {
                        const { notes } = getInternals(this);

                        while (note = notes[++n]) {
                            // If sustain is off and sustain state 2, which means
                            // note has been stopped, remove note
                            if (!event[3] && note.sustain === 2) removeNote(notes, n--);
                            note.push(event);
                        }
                    },

                    force: (event) => {
                        const { notes } = getInternals(this);

                        let n = -1;
                        let note;
                        while (note = notes[++n]) {
                            note.push(event);

                            // TEMP. Move this
                            assignAttributes(note.element, {
                                r: 0.5 + Math.sqrt(note.force) * 2.6
                            });
                        };
                    }
                })
            })),

            size: 1
        };

        const outputs = { size: 0 };

        // Is this the best place to do this?
        this.node = new EventsNode(inputs, outputs);

        lifecycle.construct.apply(this, arguments);

        const svg        = shadow.querySelector('svg');
        const svgRegions = shadow.getElementById('regions');
        const regions = Array.from({ length: 128 }, (n, i) => {
            const box = numberToRegion(i);
            const r = toDistance(128 - i);
            return create('path', {
                d: i < 116 ?
                // First 116
                'M' + box.p1.join(',')
                 + 'L' + box.p2.join(',')
                 + 'A' + r + ' ' + r + ' 0 0 1 ' + box.p3.join(' ')
                 + 'L' + box.p4.join(',')
                 + 'A' + r + ' ' + r + ' 0 0 0 ' + box.p1.join(' ')
                 + 'Z' :
                // Last twelve segments meet in centre
                'M0 0'
                + 'L' + box.p2.join(',')
                + 'A' + r + ' ' + r + ' 0 0 1 ' + box.p3.join(' ')
                + 'Z' ,
                class: 'region',
                data: { pitch: toNoteName(i).replace(/\d/, ($0) => '-' + $0) }
            });
        });
        svgRegions.append.apply(svgRegions, regions);

        /*
        const circles = Array.from({ length: 128 }, (n, i) => {
            const xy = numberToXY(i);
            return create('circle', { cx: xy[0], cy: xy[1], r: 1.4, style: 'fill: #e0e0e0;' });
        });
        svg.append.apply(svg, circles);
        */

        const discs = Array.from({ length: 12 }, (n, i) => {
            const polar = numberToDA(i);
            const cart  = toCartesian([44.5, polar[1]]);
            return create('circle', {
                cx: cart[0],
                cy: cart[1],
                r:  5,
                class: 'disc',
                data: { pitch: toRootName(i) }
            });
        });
        svgRegions.append.apply(svgRegions, discs);

        const names = Array.from({ length: 12 }, (n, i) => {
            const polar = numberToDA(i);
            const cart  = toCartesian([44.5, polar[1]]);
            return create('text', {
                x: cart[0],
                y: cart[1],
                class: 'name',
                textContent: toRootName(i),
                data: { pitch: toRootName(i) }
            });
        });
        svgRegions.append.apply(svgRegions, names);

        internals.regions = regions;
        internals.names   = names;
        internals.notes   = [];
        internals.dots    = [];
    },

    connect: function(shadow, internals, data) {
        lifecycle.connect.apply(this, arguments);

        // TEMP
        if (!this.range) this.range = 2;

        const { notes, dots } = internals;
        const svgRegions = shadow.getElementById('regions');
        const svgNotes   = shadow.getElementById('notes');

        /*const pitch = frequencyToFloat(this.frequency);
        notes.push(Note.of(pitch));

        const number = Math.round(float);
        const name   = toNoteName(number);
        const region = internals.regions[number];
        region.classList.add('highlight');*/

        const notesData = Data.of(notes);

        return [
            render(() => {
                notesData.length;
                svgRegions.querySelectorAll('.highlight').forEach((node) => node.classList.remove('highlight'));
                notes.forEach((note) => svgRegions.querySelector('[data-pitch="' + toNoteName(Math.round(note.pitch)).replace(/\d/, ($0) => '-' + $0) + '"]').classList.add('highlight'));
                svgNotes.append.apply(svgNotes, notesData.map(noteToElement));
            })
        ];
    }
}, properties);
