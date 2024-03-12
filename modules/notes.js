
import intersect from './intersect.js';
import { consonance, chromaticism, parallelism, contraryParallelism, numberToIntervalName } from './harmony';

const DEBUG  = true;
const assign = Object.assign;


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

export default class Notes {
    //static cache = {}
    static of() { return this.from(arguments); }
    static from(numbers) { return new this(numbers); }

    constructor(numbers) {
        // Check validity of arguments
        if (DEBUG) { validate(numbers); }

        // Instantiate as TypedArray
        this.data = Int8Array.from(numbers);

        // Generate id
        this.id = this.data.join();

        // Properties
        this.size       = this.data.length;
        this.range      = this.data.length ? this.data[this.data.length - 1] : 0 ;
        this.density    = this.data.length / (this.range + 1);
        this.consonance = consonance(this.data);
    }
}

Notes.normalise = function(notes) {
    let i = notes.length;
    while (i--) notes[i] = notes[i] - notes[0];
    return notes;
};

Notes.invert = function(notes) {
    if (notes.range > 11) {
        throw new Error('TODO: Not implemented Notes.invert() of notes with range > octave');
    }

    // Cannot invert single notes or silence
    if (notes.data.length < 2) {
        return notes;
    }

    // Renormalise to notes[1] as bass
    const array = notes.data.map((n) => n - notes.data[1]);
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
        if (inversion.id === notes.id) { break; }
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
