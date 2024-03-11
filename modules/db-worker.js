
import overload from '../../fn/modules/overload.js';
import Notes    from './notes.js';
import { numberToIntervalName } from './harmony';
import { openDB, deleteDB, wrap, unwrap } from '../idb/idb.js';


const assign    = Object.assign;
const beginTime = performance.now() / 1000;


// Worker

const message = {};

function send(command, data) {
    // populate message
    message.command = command;
    message.data    = data;

    // Send it
    postMessage(message);
}

onmessage = overload((e) => e.data.command, {
    default: (e) => console.log('message', e)
});


// Set up database

console.log('Populating database');

const db             = await openDB('music', 1, {
    upgrade(db, oldVersion, newVersion, transaction, e) {
        console.log('UPGRADE', db, oldVersion, newVersion, transaction);

        const modes = db.createObjectStore('modes', {
            keyPath: 'id',
            autoIncrement: false
        });

        const relations = db.createObjectStore('relations', {
            autoIncrement: true
        });
    },

    blocked(currentVersion, blockedVersion, e) {
        console.log('BLOCKED', currentVersion, blockedVersion);
    },

    blocking(currentVersion, blockedVersion, e) {
        console.log('BLOCKING', currentVersion, blockedVersion);
    },

    terminated() {
        console.log('TERMINATED');
    },
});
const transaction    = db.transaction(['modes', 'relations'], 'readwrite');
const modesStore     = unwrap(transaction.objectStore('modes'));
const relationsStore = transaction.objectStore('relations');
const modes          = [];

let mode;

function onerror(e) {
    const error = e.target.error;
    if (error.name === 'ConstraintError' && error.message === 'Key already exists in the object store.') {
        e.stopPropagation();
        e.preventDefault();
    }
}

function hasCluster(array, size = 4) {
    // Does array have cluster of size or more half-steps?
    if (array.length < size) { return false; }

    let i = 0, count = 0;
    while (array[++i]) {
        // Is this note greater than a half-step from the last?
        if ((array[i] - array[i - 1]) > 1) {
            // Reset count
            count = 0;
        }
        else {
            // Is the cluster as big as size?
            count++;
            if (count === size) {
                return true;
            }
        }
    }

    return false;
}

function generateModes(array, fn, maxSize, maxRange) {
    let i = array.length;
    let n = array[i - 1];
    while (n++ < maxRange) {
        array[i] = n;
        array.length = i + 1;

        // Reject clusters of 3 or more half-steps, simply because
        // we'll never use them and they'll clog up the db
        if (!hasCluster(array, 4)) {
            fn(new Notes(array));
        }

        if (array.length < maxSize) {
            generateModes(array, fn, maxSize, maxRange);
        }
    }
}


// Populate with silence
modes.push(assign(Notes.of(),  { name: 'Silence' }));

// Populate with single note
modes.push(assign(Notes.of(0), { name: 'Note' }));

// Populate with named intervals
let n = 0, name;
while (name = numberToIntervalName(++n)) {
    modes.push(assign(Notes.of(0, n), { name }));
}

// Populate with named triads
modes.push(
    mode = assign(Notes.of(0,4,7),    { name: "Major triad" }),
    mode = assign(Notes.invert(mode), { name: "Major triad 1st inversion" }),
    mode = assign(Notes.invert(mode), { name: "Major triad 2nd inversion" }),

    mode = assign(Notes.of(0,3,7),    { name: "Minor triad" }),
    mode = assign(Notes.invert(mode), { name: "Minor triad 1st inversion" }),
    mode = assign(Notes.invert(mode), { name: "Minor triad 2nd inversion" })
);

// Populate with common quads
modes.push.apply(modes, Notes.inversions(Notes.of(0, 5, 7, 10))); // Maj 7
modes.push.apply(modes, Notes.inversions(Notes.of(0, 4, 7, 11))); // Sus 4
modes.push.apply(modes, Notes.inversions(Notes.of(0, 3, 7, 11))); // Min Maj
modes.push.apply(modes, Notes.inversions(Notes.of(0, 3, 7, 10))); // Min 7
modes.push.apply(modes, Notes.inversions(Notes.of(0, 3, 6, 10))); // Half Dim
modes.push.apply(modes, Notes.inversions(Notes.of(0, 3, 6, 9 ))); // Dim

// Populate with named scales
modes.push(
    mode = assign(Notes.of(0,2,4,7,9),      { symbol: "6",     name: "Pentatonic 1st mode (major)" }),
    mode = assign(Notes.invert(mode),       { symbol: "9sus",  name: "Pentatonic 2nd mode"  }),
    mode = assign(Notes.invert(mode),       { symbol: "-♭6",   name: "Pentatonic 3rd mode"   }),
    mode = assign(Notes.invert(mode),       { symbol: "13sus", name: "Pentatonic 4th mode" }),
    mode = assign(Notes.invert(mode),       { symbol: "-11",   name: "Pentatonic 5th mode (minor)" }),

    mode = assign(Notes.of(0,1,5,7,10),     { name: "Insen 1st mode",  symbol: "sus7♭9" }),
    mode = assign(Notes.invert(mode),       { name: "Insen 2nd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Insen 3rd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Insen 4th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Insen 5th mode" }),

    mode = assign(Notes.of(0,2,4,6,8,10),   { name: "Whole tone",  symbol: "7+" }),

    mode = assign(Notes.of(0,2,4,5,7,9,11), { name: "Ionian",     symbol: "∆" }),
    mode = assign(Notes.invert(mode),       { name: "Dorian",     symbol: "-7" }),
    mode = assign(Notes.invert(mode),       { name: "Phrygian",   symbol: "sus7♭9" }),
    mode = assign(Notes.invert(mode),       { name: "Lydian",     symbol: "∆♯11" }),
    mode = assign(Notes.invert(mode),       { name: "Mixolydian", symbol: "7" }),
    mode = assign(Notes.invert(mode),       { name: "Aeolian",    symbol: "-♭6" }),
    mode = assign(Notes.invert(mode),       { name: "Locrian",    symbol: "ø" }),

    mode = assign(Notes.of(0,2,3,5,7,9,11), { name: "Melodic Minor 1st mode", symbol: "-∆" }),
    mode = assign(Notes.invert(mode),       { name: "Melodic Minor 2nd mode", symbol: "7sus♭9" }),
    mode = assign(Notes.invert(mode),       { name: "Melodic Minor 3rd mode", symbol: "∆♯5" }),
    mode = assign(Notes.invert(mode),       { name: "Melodic Minor 4th mode", symbol: "7♯11" }),
    mode = assign(Notes.invert(mode),       { name: "Melodic Minor 5th mode", symbol: "7♭13" }),
    mode = assign(Notes.invert(mode),       { name: "Melodic Minor 6th mode", symbol: "ø" }),
    mode = assign(Notes.invert(mode),       { name: "Melodic Minor 7th mode", symbol: "7alt" }),

    mode = assign(Notes.of(0,2,4,5,7,8,11), { name: "Harmonic Major 1st mode", symbol: "∆♭6" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Major 2nd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Major 3rd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Major 4th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Major 5th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Major 6th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Major 7th mode" }),

    mode = assign(Notes.of(0,2,3,5,7,8,11), { name: "Harmonic Minor 1st mode", symbol: "-♭6" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Minor 2nd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Minor 3rd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Minor 4th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Minor 5th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Minor 6th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Harmonic Minor 7th mode" }),

    mode = assign(Notes.of(0,1,4,5,7,8,11), { name: "Double Harmonic Major 1st mode" }),
    mode = assign(Notes.invert(mode),       { name: "Double Harmonic Major 2nd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Double Harmonic Major 3rd mode" }),
    mode = assign(Notes.invert(mode),       { name: "Double Harmonic Major 4th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Double Harmonic Major 5th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Double Harmonic Major 6th mode" }),
    mode = assign(Notes.invert(mode),       { name: "Double Harmonic Major 7th mode" }),

    mode = assign(Notes.of(0,2,3,5,6,8,9,11), { name: "Diminished whole step / half step", symbol: "˚" }),
    mode = assign(Notes.invert(mode),         { name: "Diminished half step / whole step", symbol: "7♭9" })
);


// Add named modes to db
let i = -1;
while (modes[++i]) modesStore.add(modes[i]).onerror = onerror;

// Fill in all other modes
generateModes([0], (notes) => modesStore.add(notes).onerror = onerror, 6, 36);


await transaction.done.then(() => {
    const endTime = performance.now() / 1000;
    send('db-populated', { elapsedTime: endTime - beginTime });
});

