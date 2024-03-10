// music-harmony.js
// Analysis arrays of note numbers for harmonic properties.

import intersect from './intersect.js';
import config from './config.js';

const noteNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'B♭', 'B'];

const noteNumbers = {
	'C':  0, 'C♯': 1, 'D♭': 1, 'D': 2, 'D♯': 3, 'E♭': 3, 'E': 4,
	'F':  5, 'F♯': 6, 'G♭': 6, 'G': 7, 'G♯': 8, 'A♭': 8, 'A': 9,
	'A♯': 10, 'B♭': 10, 'B': 11
};

const A4 = 69;

const rnotename = /^([A-G][♭♯]?)(-?\d)$/;
const rshorthand = /[b#]/g;

// This is a limit on how far away a parallel group can be and still be
// considered parallel. Y'know, 3 octave jumps don't sound all that parallel.
const parallelGroupTransposeLimit = 24;

const intervalNames = [
	'unison', '♭2nd', '2nd', '-3rd', '∆3rd', '4th', 'tritone', '5th', '♭6th', '6th', '-7th', '∆7th',
	'octave', '♭9th', '9th', '♯9th', '10th', '11th', '♯11th', '12th', '♭13th', '13th'
];

export const modes = [
	{ scale: [0,2,4,7,9],      group: "pentatonic", name: "major pentatonic", tonic: 0, symbol: "∆" },
	{ scale: [0,2,5,7,10],     group: "pentatonic", name: "",                 tonic: 2, symbol: "7sus9" },
	{ scale: [0,3,5,8,10],     group: "pentatonic", name: "",                 tonic: 4, symbol: "-♭6" },
	{ scale: [0,2,5,7,9],      group: "pentatonic", name: "",                 tonic: 7, symbol: "7sus13" },
	{ scale: [0,3,5,7,10],     group: "pentatonic", name: "minor pentatonic", tonic: 9, symbol: "-7" },

	{ scale: [0,1,5,7,10],     group: "insen", name: "insen 1st mode", tonic: 0,  symbol: "sus7♭9" },
	{ scale: [0,4,6,9,11],     group: "insen", name: "insen 2nd mode", tonic: 1,  symbol: "" },
	{ scale: [0,2,5,7,8],      group: "insen", name: "insen 3rd mode", tonic: 5,  symbol: "" },
	{ scale: [0,3,5,6,10],     group: "insen", name: "insen 4th mode", tonic: 7,  symbol: "" },
	{ scale: [0,2,3,7,9],      group: "insen", name: "insen 5th mode", tonic: 10, symbol: "" },

	{ scale: [0,2,4,6,8,10],   group: "whole tone", name: "whole tone", tonic: 0, symbol: "7+" },

	{ scale: [0,2,4,5,7,9,11], group: "major", name: "ionic",      tonic: 0,  symbol: "∆" },
	{ scale: [0,2,3,5,7,9,10], group: "major", name: "dorian",     tonic: 2,  symbol: "-7" },
	{ scale: [0,1,3,5,7,8,10], group: "major", name: "phrygian",   tonic: 4,  symbol: "sus7♭9" },
	{ scale: [0,2,4,6,7,9,11], group: "major", name: "lydian",     tonic: 5,  symbol: "∆♯11" },
	{ scale: [0,2,4,5,7,9,10], group: "major", name: "mixolydian", tonic: 7,  symbol: "7" },
	{ scale: [0,2,3,5,7,8,10], group: "major", name: "aeolian",    tonic: 9,  symbol: "-♭6" },
	{ scale: [0,1,3,5,6,8,10], group: "major", name: "locrian",    tonic: 11, symbol: "ø" },

	{ scale: [0,2,3,5,7,9,11], group: "melodic minor", name: "", tonic: 0,  symbol: "-∆" },
	{ scale: [0,1,3,5,7,9,10], group: "melodic minor", name: "", tonic: 2,  symbol: "sus7♭9" },
	{ scale: [0,2,4,6,8,9,11], group: "melodic minor", name: "", tonic: 3,  symbol: "∆♯5" },
	{ scale: [0,2,4,6,7,9,10], group: "melodic minor", name: "", tonic: 5,  symbol: "7♯11" },
	{ scale: [0,2,4,5,7,8,10], group: "melodic minor", name: "", tonic: 7,  symbol: "7♭13" },
	{ scale: [0,2,3,5,6,8,10], group: "melodic minor", name: "", tonic: 9,  symbol: "ø" },
	{ scale: [0,1,3,4,6,8,10], group: "melodic minor", name: "", tonic: 11, symbol: "7alt" },

	{ scale: [0,2,3,5,7,8,11], group: "harmonic minor", name: "", tonic: 0,  symbol: "-♭6" },
	{ scale: [0,1,3,5,6,9,10], group: "harmonic minor", name: "", tonic: 2,  symbol: "" },
	{ scale: [0,2,4,5,8,9,11], group: "harmonic minor", name: "", tonic: 3,  symbol: "" },
	{ scale: [0,2,3,6,7,9,10], group: "harmonic minor", name: "", tonic: 5,  symbol: "" },
	{ scale: [0,1,4,5,7,8,10], group: "harmonic minor", name: "", tonic: 7,  symbol: "" },
	{ scale: [0,3,4,6,7,9,11], group: "harmonic minor", name: "", tonic: 8,  symbol: "" },
	{ scale: [0,1,3,4,6,8,9],  group: "harmonic minor", name: "", tonic: 11, symbol: "" },

	{ scale: [0,2,4,5,7,8,11], group: "harmonic major", name: "", tonic: 0,  symbol: "" },
	{ scale: [0,2,3,5,6,9,10], group: "harmonic major", name: "", tonic: 2,  symbol: "" },
	{ scale: [0,1,3,4,7,8,10], group: "harmonic major", name: "", tonic: 4,  symbol: "" },
	{ scale: [0,2,3,6,7,9,11], group: "harmonic major", name: "", tonic: 5,  symbol: "" },
	{ scale: [0,1,4,5,7,9,10], group: "harmonic major", name: "", tonic: 7,  symbol: "" },
	{ scale: [0,3,4,6,8,9,11], group: "harmonic major", name: "", tonic: 8,  symbol: "" },
	{ scale: [0,1,3,5,6,8,9],  group: "harmonic major", name: "", tonic: 11, symbol: "" },

	{ scale: [0,1,4,5,7,8,11],  group: "double harmonic major", name: "", tonic: 0,  symbol: "" },
	{ scale: [0,3,4,6,7,10,11], group: "double harmonic major", name: "", tonic: 1,  symbol: "" },
	{ scale: [0,1,3,4,7,8,9],   group: "double harmonic major", name: "", tonic: 4,  symbol: "" },
	{ scale: [0,2,3,6,7,8,11],  group: "double harmonic major", name: "", tonic: 5,  symbol: "" },
	{ scale: [0,1,4,5,6,9,10],  group: "double harmonic major", name: "", tonic: 7,  symbol: "" },
	{ scale: [0,3,4,5,8,9,11],  group: "double harmonic major", name: "", tonic: 8,  symbol: "" },
	{ scale: [0,1,2,5,6,8,9],   group: "double harmonic major", name: "", tonic: 11, symbol: "" },

	{ scale: [0,2,3,5,6,8,9,11], group: "diminished", name: "whole step / half step", tonic: 0, symbol: "˚7" },
	{ scale: [0,1,3,4,6,7,9,10], group: "diminished", name: "half step / whole step", tonic: 2, symbol: "7♭9" }
];

var rootModes = (function(modes) {
	var roots = {};

	modes.forEach(function(mode) {
		if (mode.tonic === 0) {
			roots[mode.group] = mode;
		}
	});

	return roots;
})(modes);


// Arrays functions

// Map
function mod12(n) { return n % 12; }
function square(n) { return n * n; };
function root(n) { return Math.sqrt(n); };
function increment(n) { return ++n; };
function decrement(n) { return --n; };
function increment12(n) { return n + 12; };
function decrement12(n) { return n - 12; };

// Filter
function unique(n, i, array) { return array.indexOf(n) === i; };

// Sort
function lesser(v1, v2) { return v2 - v1; };
function greater(v1, v2) { return v1 - v2; };
function shorter(arr1, arr2) { return arr2.length - arr1.length; };
function longer(arr1, arr2) { return arr1.length - arr2.length; };

function unite(arr1, arr2) {
	return arr1.concat(arr2).filter(unique);
}

function isSubset(arr1, arr2) {
	// Is arr2 a subset of arr1?
	var n = arr2.length;

	while (n--) {
		if (arr1.indexOf(arr2[n]) === -1) {
			return false;
		}
	}

	return true;
}

// Fractions

function gcd(a, b) {
	// Greatest common divider
	return b ? gcd(b, a % b) : a ;
}

function lcm(a, b) {
	// Lowest common multiple.
	return a * b / gcd(a, b);
}

function factorise(n, d) {
	// Reduce a fraction by finding the Greatest Common Divisor and
	// dividing by it.
	var f = gcd(n, d);
	return [n/f, d/f];
}




// Harmonic analysis
//
// References:
// http://www.acousticslab.org/learnmoresra/moremodel.html
// https://en.wikipedia.org/wiki/Roughness_%28psychophysics%29
// http://music.stackexchange.com/questions/4439/is-there-a-way-to-measure-the-consonance-or-dissonance-of-a-chord

var intervals = justIntervals();

// The multiplication factor we use to turn floats into in integer
// maths avoiding rounding errors. Essentially a common numerator.
// Just stack all the primes.
var factor = 37 * 31 * 29 * 23 * 19 * 17 * 13 * 11 * 7 * 5 * 4 * 3 * 2;
var factorvals = intervals.map(function(n) { return n * factor; });

function evenIntervals() {
	var ratio = Math.pow(2, 1/12),
		i = -1,
		intervals = [1];

	while (++i < 128) {
		intervals.push(intervals[intervals.length - 1] * ratio);
	}

	return intervals;
}

function justIntervals() {
	var intervals = [1, 16/15, 9/8, 6/5, 5/4, 4/3, 7/5, 3/2, 8/5, 10/6, 9/5, 15/8],
		i = intervals.length - 1;

	while (++i < 128) {
		intervals.push(intervals[i-12] * 2);
	}

	return intervals;
}

function weightedIntervals() {
	// Rates intervals by their position in the harmonic series. The idea
	// is called 'interval strength'. It's related to the combined tone
	// method, but not identical.
	// http://en.wikipedia.org/wiki/Harmonic_series_(music)
	return [1, 15, 8, 5, 4, 3, 5, 2, 5, 6, 5, 8, 1];
}

function toInterval(n, i) {
	return intervals[n];
}

function toFactorval(n, i) {
	return factorvals[n];
}



function wrap12(n) {
	var m = n % 12;
	return m < 0 ? m + 12 : m;
}

var addFns = {};

function createAddFn(x) {
	return addFns[x] || (addFns[x] = function add(n) {
			return x + n;
		});
}

function floor(array) {
	// Make sure the array's lowest note is 0
	var min = Math.min.apply(Math, array);
	return transpose(array, -min);
}

export function consonance(array) {
	var arr = floor(array);
	return Math.sqrt(arr.map(toFactorval).reduce(gcd, factor) / factor);
}

export function density(array) {
	return array.length / (range(array) + 1);
}

export function range(array) {
	return Math.max.apply(Math, array) - Math.min.apply(Math, array);
}

export function invert(array, n) {

}

export function transpose(array, n) {
	return array.map(createAddFn(n));
}

export function toScale(array) {
	return array.map(mod12).filter(unique).sort(greater);
}

export function getModes(array) {
	var scale = toScale(array);
	var min = scale[0];

	if (min !== 0) {
		scale = transpose(scale, -min);
	}

	var n = -1;
	var l = modes.length;
	var results = [];
	var rootMode;

	while (++n < l) {
		if (isSubset(modes[n].scale, scale)) {
			rootMode = rootModes[modes[n].group];
			results.push([wrap12(min - modes[n].tonic), rootMode]);
		}
	}

	return results;
}


function propArray(object) { return object.array; }
function propTrans(object) { return object.trans; }
function propLength(object) { return object.length; }

function chromaticGroups(arr1, arr2) {
	var l1 = arr1.length, i1 = -1,
		l2 = arr2.length, i2 = -1,
		arr3 = [],
		// Transposing by 0 is not parallelism
		ignore = { 0: true },
		intersection, t, n;

	// For every value in arr1, transpose every value in arr2 to match it
	// and then test the intersection for length.
	while (++i1 < l1) {
		n = arr1[i1];
		i2 = -1;
		//console.log('n', n);
		while (++i2 < l2) {
			t = n - arr2[i2];
		//console.log('t', t);
			if (Math.abs(t) > parallelGroupTransposeLimit) { continue; }

			// We may have already tested and stored this transposition.
			if (ignore[t]) { continue; }
			ignore[t] = true;

			// Get all matching notes
			intersection = intersect(arr1, arr2.map(createAddFn(t)));

			// Throw away any results that are only a single note
			if (intersection.length === 1) { continue; }

			arr3.push({
				array: intersection,
				trans: -t
			});
		}
	}

	return arr3;
}

function findParallels(arr1, arr2) {
	// Seeks out all parallel groups and reports back the highest rated set
	// of groups.

	// Something about this is not quite right. It skips over lower level solutions
	// when higher level ones have already been found. Or something

	var rate = 0,
		output = {
			rating: 0,
			level: 0,
			groups: []
		},
		groups, l, group, rate1, rate2, diff1, diff2, obj, trans;

	// A quick exit
	if (arr1.length === 0) {
		return output;
	}

	// Get all possible chromatic groups
	groups = chromaticGroups(arr1, arr2);
	l = groups.length;

	while (l--) {
		group = groups[l];
		rate1 = group.array.length / arr1.length;

		// A quick exit when the group matches arr1 exactly
		if (rate1 === 1) {
			output.rating = 1;
			output.groups = [group];
			return output;
		}

		// subtract this group from both arrays, and then use those difference
		// arrays to get the leftover parallels.
		diff1 = diff(arr1, group.array);
		diff2 = diff(arr2, group.array.map(fnAdd(group.trans)));
		obj = findParallels(diff1, diff2);
		rate2 = obj.rating * (1 - rate1);

		// Use the output object given by the bottom level recursion. In the
		// case where a group is giving an identical rating to a previous one,
		// use the group that requires less transposition.
		if (rate < rate1 + rate2 ||
			rate === rate1 + rate2 && group.trans < trans) {

			obj.rating = rate1 + rate2;

			// Keep a track of the winning combination of groups
			obj.groups.push(group);

			// Increment it's level. We use level to detect how for the
			// recursion has gone - if it doesn't recurse, there's only
			// one parallel group, and thus no contrary motion.
			obj.level++;

			trans = group.trans;
		}
		else {
			obj = false;
		}
	}

	return obj || output;
}

export function chromaticism(arr1, arr2) {
	var down = intersect(arr1, arr2.map(increment)),
		up   = intersect(arr1, arr2.map(decrement));

	return unite(down, up).length / arr1.length;
}

export function parallelism(arr1, arr2) {
	var lengths;

	// Single notes or silence do not count as parallelism
	if (arr1.length < 2) { return 0; }

	return Math.max.apply(Math, chromaticGroups(arr1, arr2)
		.map(propArray)
		.map(propLength)) / arr1.length ;
}

export function contraryParallelism(arr1, arr2) {
	// It's impossible to have contrary parallelism with less than 4 notes.
	if (arr1.length < 4) { return 0; }

	var data = findParallels(arr1, arr2);

	// Parallels from one level deep are not 'contrary', as there
	// is only one of them.
	if (data.level === 0) { return 0; }

	//console.log(data.groups);

	return data.rating;
}

function replaceSymbol($0, $1) {
	return $1 === '#' ? '♯' :
		$1 === 'b' ? '♭' :
		'' ;
}

export function normaliseNoteName(name) {
	return name.replace(rshorthand, replaceSymbol);
}

export function noteToNumber(str) {
	var r = rnotename.exec(normaliseNoteName(str));
	return (parseInt(r[2]) + 1) * 12 + noteNumbers[r[1]];
}

export function numberToNote(n) {
	return noteNames[n % 12] + numberToOctave(n);
}

export function numberToOctave(n) {
	return Math.floor(n / 12) - 1;
}

export function numberToFrequency(n, tuning) {
	return (tuning || config.tuning) * Math.pow(2, (n - A4) / 12);
}

export function frequencyToNumber(frequency, tuning) {
	var number = A4 + 12 * Math.log(frequency / (tuning || music.tuning)) / Math.log(2);

	// Rounded it to nearest 1,000,000th to avoid floating point errors and
	// return whole semitone numbers where possible. Surely no-one needs
	// more accuracy than a millionth of a semitone?
	return Math.round(1000000 * number) / 1000000;
}

export function numberToIntervalName(n) {
	return intervalNames[n];
}
