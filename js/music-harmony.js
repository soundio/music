// harmony.js
// Analysis arrays of note numbers for harmonic properties.
//
// References:
// http://www.acousticslab.org/learnmoresra/moremodel.html
// https://en.wikipedia.org/wiki/Roughness_%28psychophysics%29
// http://music.stackexchange.com/questions/4439/is-there-a-way-to-measure-the-consonance-or-dissonance-of-a-chord

(function(window) {
	"use strict";

	var modes = [
		{ scale: [0,1,5,7,10],       name: "insen",                 mode: 0, symbol: "sus7♭9" },

		{ scale: [0,2,4,7,9],        name: "pentatonic",            mode: 0, symbol: "∆" },
		{ scale: [0,2,5,7,10],       name: "pentatonic",            mode: 0, symbol: "7sus9" },
		{ scale: [0,3,5,8,10],       name: "pentatonic",            mode: 0, symbol: "-♭6" },
		{ scale: [0,2,5,7,9],        name: "pentatonic",            mode: 0, symbol: "7sus13" },
		{ scale: [0,3,5,7,10],       name: "pentatonic",            mode: 0, symbol: "-7" },

		{ scale: [0,2,4,5,7,9,11],   name: "major",                 mode: 0, symbol: "∆" },
		{ scale: [0,2,3,5,7,9,10],   name: "major",                 mode: 1, symbol: "-7" },
		{ scale: [0,1,3,5,7,8,10],   name: "major",                 mode: 0, symbol: "sus7♭9" },
		{ scale: [0,2,4,6,7,9,11],   name: "major",                 mode: 0, symbol: "∆♯11" },
		{ scale: [0,2,4,5,7,9,10],   name: "major",                 mode: 0, symbol: "7" },
		{ scale: [0,2,3,5,7,8,11],   name: "major",                 mode: 0, symbol: "-♭6" },
		{ scale: [0,1,3,5,6,8,10],   name: "major",                 mode: 0, symbol: "ø" },

		{ scale: [0,2,4,5,7,8,9,11], name: "bebop major",           mode: 0, symbol: "∆" },
		{ scale: [0,2,3,5,7,9,11],   name: "melodic minor",         mode: 0, symbol: "-∆" },
		{ scale: [0,2,3,5,7,8,11],   name: "harmonic minor",        mode: 0, symbol: "-∆♭6" },
		{ scale: [0,2,4,5,7,8,11],   name: "harmonic major",        mode: 0, symbol: "∆♭6" },
		{ scale: [0,2,4,5,7,8,11],   name: "double harmonic major", mode: 0, symbol: "∆♭6♯9" },

		{ scale: [0,2,3,5,6,8,9,11], name: "diminished",            mode: 0, symbol: "˚7" },
		{ scale: [0,1,3,4,6,7,9,10], name: "diminished",            mode: 0, symbol: "7♭9" }
	];

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

	// Arrays

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


	// Harmony
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

	function consonance(array) {
		var arr = floor(array);
		return Math.sqrt(arr.map(toFactorval).reduce(gcd, factor) / factor);
	}

	function density(array) {
		return array.length / (range(array) + 1);
	}

	function range(array) {
		return Math.max.apply(Math, array) - Math.min.apply(Math, array);
	}

	function invert(array, n) {
		
	}

	function transpose(array, n) {
		return array.map(createAddFn(n));
	}


	function scale(array) {
		return array.map(mod12).filter(unique).sort(greater);
	}

	function getModes(array) {
		var mode = mode(array);
		var n = modes.length;
		var results = [];

		while (n--) {
			if (isSubset(modes[n].scale, mode)) {
				results.push(modes[n]);
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
				intersection = fn.intersect(arr1, arr2.map(fnAdd(t)));
				
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

	function chromaticism(arr1, arr2) {
		var down = fn.intersect(arr1, arr2.map(increment)),
		    up   = fn.intersect(arr1, arr2.map(decrement));

		return fn.unite(down, up).length / arr1.length;
	};

	function parallelism(arr1, arr2) {
		var lengths;

		// Single notes or silence do not count as parallelism
		if (arr1.length < 2) { return 0; }

		return chromaticGroups(arr1, arr2)
			.map(propArray)
			.map(propLength)
			.reduce(fn.max, 0) / arr1.length ;
	}

	function contraryParallelism(arr1, arr2) {
		// It's impossible to have contrary parallelism with less than 4 notes.
		if (arr1.length < 4) { return 0; }

		var data = findParallels(arr1, arr2);

		// Parallels from one level deep are not 'contrary', as there
		// is only one of them.
		if (data.level === 0) { return 0; }

		//console.log(data.groups);

		return data.rating;
	}

	window.music = {
		modes: modes,

		consonance: consonance,
		density: density,
		range: range,
		scale: scale,

		invert: invert,
		transpose: transpose,

		chromaticism: chromaticism,
		parallelism: parallelism,
		contraryParallelism: contraryParallelism
	};
})(window);