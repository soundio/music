import assignAttributes from 'dom/assign.js';
import create           from 'dom/create.js';
import Data             from 'fn/data.js';
import overload         from 'fn/overload.js';
import toCartesian      from 'fn/vector/to-cartesian-2d.js';
import element, { getInternals }  from 'literal/element/element.js';
import { frequencyToFloat }       from 'midi/frequency.js';
import { int7ToFloat }            from 'midi/maths.js';
import { toRootName, toNoteName } from 'midi/note.js';
import { isNoteOn, isControl, toChannel, toType, toSignedFloat } from 'midi/message.js';


const assign = Object.assign;


/* Note() */

function Note(pitch = 69, force = 0.5) {
    this.pitchStart = pitch;
    this.pitch = pitch;
    this.force = force;
}

assign(Note, {
    of: function(pitch, force) {
        return new Note(pitch, force);
    },

    from: function(data) {
        return new Note(data.pitch, data.force);
    },

    fromMIDI: function(message) {
        return new Note(message[1], int7ToFloat(message[2]));
    }
});


/* Functions */

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

function removeNote(notes, i) {
    const element = notes[i].element;
    if (element) element.remove();
    Data.of(notes).splice(i, 1);
}

export default element('note-radar', {
    shadow: `
        <link rel="stylesheet" href="./shadow.css" />
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
        const { notes, dots } = internals;
        const svgRegions = shadow.getElementById('regions');
        const svgNotes   = shadow.getElementById('notes');

        /*const pitch = frequencyToFloat(this.frequency);
        notes.push(Note.of(pitch));

        const number = Math.round(float);
        const name   = toNoteName(number);
        const region = internals.regions[number];
        region.classList.add('highlight');*/

        Data.observe('length', notes, () => {
            console.log('RENDER', notes);
            notes.forEach((note) => svgRegions.querySelector('[data-pitch="' + toNoteName(Math.round(note.pitch)).replace(/\d/, ($0) => '-' + $0) + '"]').classList.add('highlight'));
            svgNotes.append.apply(svgNotes, notes.map(noteToElement));
        }, 0);
    }
}, {
    frequency: 'number',
    scale:     'string',
    midi: {
        value: overload(toType, {
            noteon: function(message) {
                const { notes } = getInternals(this);
                const note = Note.fromMIDI(message);
                note.message = message;
                Data.of(notes).push(note);
            },

            noteoff: function(message) {
                const { notes } = getInternals(this);

                // Remove matching note
                const i = notes.findIndex((note) => note.message
                    && isNoteOn(note.message)
                    && toChannel(note.message) === toChannel(message)
                    && note.message[1] === message[1]
                );

                // No matching noteon found
                if (i === -1) return;
                const note = notes[i];

                if (note.sustain) {
                    // Move note to sustain state 2 to mark for removal when
                    // sustain pedal is lifted
                    note.sustain = 2;
                }
                else {
                    removeNote(notes, i);
                }
            },

            pitch: function(message) {
                const { notes } = getInternals(this);
                const bend = range * toSignedFloat(message);

                let n = -1;
                let note, originalPitch;

                while (note = notes[++n]) if (toChannel(note.message) === toChannel(message)) {
                    if (!note.pitchStart) note.pitchStart = note.pitch;
                    note.pitch = note.pitchStart + bend;
                };
            },

            control: function(message) {
                const { notes } = getInternals(this);

                // Breath control interpreted as force
                if (message[1] === 3) {
                    let n = -1;
                    let note;
                    while (note = notes[++n]) if (toChannel(note.message) === toChannel(message)) {
                        note.force =  int7ToFloat(message[2]);
                    };
                    return;
                }

                // Sustain pedal marks matching notes as sustained
                if (message[1] === 64) {
                    if (message[2]) {
                        let n = -1;
                        let note;
                        while (note = notes[++n]) if (toChannel(note.message) === toChannel(message)) {
                            note.sustain = 1;
                        };
                    }
                    else {
                        let n = -1;
                        let note;
                        while (note = notes[++n]) if (toChannel(note.message) === toChannel(message)) {
                            // Sustain state 1 means noteoff has not been recieved
                            if (note.sustain === 1) note.sustain = 0;
                            // Sustain state 2 means note has been stopped.
                            // Decrement n to stay in sync with notes array.
                            if (note.sustain === 2) removeNote(notes, n--);
                        };
                    }
                }
            }
        })
    }
});
