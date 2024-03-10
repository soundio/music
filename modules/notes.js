
import intersect from './intersect.js';
import { consonance, chromaticism, parallelism, contraryParallelism, numberToIntervalName } from './harmony';


const assign = Object.assign;
const cache  = {};


/**
define(object, name, value)
**/

const definition = {};

function define(object, name, value) {
    definition.value = value;
    Object.defineProperty(object, name, definition);
    return object[name];
}


/**
Notes()
**/

function validate(numbers) {
    // Silence is allowed
    if (numbers.length === 0) {
        return true;
    }

    // Notes must be normalised to 0 as the bass note
    if (numbers[0] !== 0) {
        throw new Error('Notes not normalised');
    }

    // Notes cannot contain duplicates
    let n = 0, i = 0;
    while (numbers[++n] !== undefined) {
        i = n;
        while (numbers[++i] !== undefined) if (numbers[n] === numbers[i]) {
            throw new Error('Notes contains duplicates');
        }
    }

    // Note numbers must be in ascending order
    n = 0;
    while (numbers[++n] !== undefined) if (numbers[n] === numbers[n - 1]) {
        throw new Error('Notes not ascending');
    }
}

export default class Notes extends Int8Array {
    static cache = {}
    static of() { return this.from(arguments); }
    static from(numbers) { return new this(numbers); }

    constructor(numbers) {
        // Check validity of arguments
        if (window.DEBUG) { validate(numbers); }

        // Instantiate as TypedArray
        super(numbers);

        // Generate id
        this.id = this.join();

        // Cache notes so there is only ever one notes object representing a given
        // collection of notes
        const cache = this.constructor.cache;
        if (cache[this.id]) { return cache[this.id]; }
        cache[this.id] = this;

        // Properties
        this.range   = this.length ? this[this.length - 1] : 0 ;
        this.density = this.length / (this.range + 1);
    }

    // Lazy self-overriding property
    get consonance() {
        return define(this, 'consonance', consonance(this));
    }

    // We do not want map to return an instance of Notes, which would create an
    // entry in cache, but of Int8 array, which is less strict
    map(fn) {
        return Int8Array.from(this, fn);
    }
}

Notes.invert = function(notes) {
    if (notes.range > 11) {
        throw new Error('TODO: Not implemented Notes.invert() of notes with range > octave');
    }

    // Cannot invert single notes or silence
    if (notes.length < 2) {
        return notes;
    }

    // Renormalise to notes[1] as bass
    const array = notes.map((n) => n - notes[1]);
    array[0] += 12;
    array.sort();
    return new Notes(array);
};

Notes.inversions = function(notes) {
    const inversions = [];

    // Find all inversions
    let inversion = notes;
    while (true) {
        inversion = Notes.invert(inversion);
        if (inversion === notes) { break; }
        inversions.push(inversion);
    }

    return inversions;
};

Notes.isSuperset = function(a, b) {
    // If a has more entries than b, b cannot be a superset
    if (a.length >= b.length) { return false; }

    // Loop through a
    let i = 0, j = 0;
    while(a[++i]) {
        while (b[++j] && a[i] !== b[j]);
        // Where j did not produce a match, it will be over b length
        if (j === b.length) { return false; }
    }

    // Everything matched!
    return true;
};

Notes.isSubset = function(a, b) {
    return Notes.isSuperset(b, a);
};

Notes.findSubsets = function(notes) {
    const subsets = [];
    let id, cached;
    for (id in Notes.cache) {
        cached = Notes.cache[id];
        if (Notes.isSubset(notes, cached)) {
            subsets.push(cached);
        }
    }
    return subsets;
};

Notes.findSupersets = function(notes) {
    const supersets = [];
    let id, cached;
    for (id in Notes.cache) {
        cached = Notes.cache[id];
        if (Notes.isSuperset(notes, cached)) {
            supersets.push(cached);
        }
    }
    return supersets;
};








// Populate with silence

const a = assign(Notes.of(),  { name: 'Silence' });

// Populate with single note

const b = assign(Notes.of(0), { name: 'Note' });

// Populate with named intervals

let n = 0, name;
while (name = numberToIntervalName(++n)) {
    assign(Notes.of(0, n), { name });
}

// Populate with named triads

let inversion;
inversion = assign(Notes.of(0,4,7),         { name: "Major triad" });
inversion = assign(Notes.invert(inversion), { name: "Major triad 1st inversion" });
inversion = assign(Notes.invert(inversion), { name: "Major triad 2nd inversion" });

inversion = assign(Notes.of(0,3,7),         { name: "Minor triad" });
inversion = assign(Notes.invert(inversion), { name: "Minor triad 1st inversion" });
inversion = assign(Notes.invert(inversion), { name: "Minor triad 2nd inversion" });

// Populate with common quads

Notes.inversions(Notes.of(0, 5, 7, 10)); // Maj 7
Notes.inversions(Notes.of(0, 4, 7, 11)); // Sus 4
Notes.inversions(Notes.of(0, 3, 7, 11)); // Min Maj
Notes.inversions(Notes.of(0, 3, 7, 10)); // Min 7
Notes.inversions(Notes.of(0, 3, 6, 10)); // Half Dim
Notes.inversions(Notes.of(0, 3, 6, 9 )); // Dim

// Populate with named scales

inversion = assign(Notes.of(0,2,4,7,9),     { symbol: "6",     name: "Pentatonic 1st mode (major)" });
inversion = assign(Notes.invert(inversion), { symbol: "9sus",  name: "Pentatonic 2nd mode"  });
inversion = assign(Notes.invert(inversion), { symbol: "-♭6",   name: "Pentatonic 3rd mode"   });
inversion = assign(Notes.invert(inversion), { symbol: "13sus", name: "Pentatonic 4th mode" });
inversion = assign(Notes.invert(inversion), { symbol: "-11",   name: "Pentatonic 5th mode (minor)" });

inversion = assign(Notes.of(0,1,5,7,10),     { name: "Insen 1st mode",  symbol: "sus7♭9" });
inversion = assign(Notes.invert(inversion),  { name: "Insen 2nd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Insen 3rd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Insen 4th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Insen 5th mode" });

inversion = assign(Notes.of(0,2,4,6,8,10),   { name: "Whole tone",  symbol: "7+" });

inversion = assign(Notes.of(0,2,4,5,7,9,11), { name: "Ionian",     symbol: "∆" });
inversion = assign(Notes.invert(inversion),  { name: "Dorian",     symbol: "-7" });
inversion = assign(Notes.invert(inversion),  { name: "Phrygian",   symbol: "sus7♭9" });
inversion = assign(Notes.invert(inversion),  { name: "Lydian",     symbol: "∆♯11" });
inversion = assign(Notes.invert(inversion),  { name: "Mixolydian", symbol: "7" });
inversion = assign(Notes.invert(inversion),  { name: "Aeolian",    symbol: "-♭6" });
inversion = assign(Notes.invert(inversion),  { name: "Locrian",    symbol: "ø" });

inversion = assign(Notes.of(0,2,3,5,7,9,11), { name: "Melodic Minor 1st mode", symbol: "-∆" });
inversion = assign(Notes.invert(inversion),  { name: "Melodic Minor 2nd mode", symbol: "7sus♭9" });
inversion = assign(Notes.invert(inversion),  { name: "Melodic Minor 3rd mode", symbol: "∆♯5" });
inversion = assign(Notes.invert(inversion),  { name: "Melodic Minor 4th mode", symbol: "7♯11" });
inversion = assign(Notes.invert(inversion),  { name: "Melodic Minor 5th mode", symbol: "7♭13" });
inversion = assign(Notes.invert(inversion),  { name: "Melodic Minor 6th mode", symbol: "ø" });
inversion = assign(Notes.invert(inversion),  { name: "Melodic Minor 7th mode", symbol: "7alt" });

inversion = assign(Notes.of(0,2,4,5,7,8,11), { name: "Harmonic Major 1st mode", symbol: "∆♭6" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Major 2nd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Major 3rd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Major 4th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Major 5th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Major 6th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Major 7th mode" });

inversion = assign(Notes.of(0,2,3,5,7,8,11), { name: "Harmonic Minor 1st mode", symbol: "-♭6" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Minor 2nd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Minor 3rd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Minor 4th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Minor 5th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Minor 6th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Harmonic Minor 7th mode" });

inversion = assign(Notes.of(0,1,4,5,7,8,11), { name: "Double Harmonic Major 1st mode" });
inversion = assign(Notes.invert(inversion),  { name: "Double Harmonic Major 2nd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Double Harmonic Major 3rd mode" });
inversion = assign(Notes.invert(inversion),  { name: "Double Harmonic Major 4th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Double Harmonic Major 5th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Double Harmonic Major 6th mode" });
inversion = assign(Notes.invert(inversion),  { name: "Double Harmonic Major 7th mode" });

inversion = assign(Notes.of(0,2,3,5,6,8,9,11), { name: "Diminished whole step / half step", symbol: "˚" });
inversion = assign(Notes.invert(inversion),    { name: "Diminished half step / whole step", symbol: "7♭9" });


/* Change

function Change(a, b, transpose = 0) {
    // Cache change so there is only ever one change object representing a given change
    const id = Notes.getId(a) + '-' + Notes.getId(b) + ':' + transpose;
    if (cache[id]) { return cache[id]; }
    cache[id] = this;

    this.a = a;
    this.b = b;
    this.transpose = transpose;

    const bt = Array.from(b, (n) => n + transpose));
    this.chromaticism        = chromaticism(a, bt)
    this.parallelism         = parallelism(a, bt);
    this.contraryParallelism = contraryParallelism(a. bt);
    this.common              = intersect(a, b).length;

    a.changes.push(this);
}



function testOption(value, option) {
        // Option is not defined
    return option === undefined ? true :
        // Option is a number
        typeof option === 'number' ? value === option :
        // Option is a range
        (value >= option[0] && value < option[1]) ;
}

function findChanges(a, options) {
    a.changes.filter(({ b }) => {
        return testOption(a.length, options.length);
    });
}

function createChanges(a, options) {

}
*/
