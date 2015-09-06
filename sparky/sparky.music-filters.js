(function(window) {
	"use strict";

	var music  = window.music;
	var Sparky = window.Sparky;
	var assign = Object.assign;

	var rtrailingnumber = /\d+$/;

	assign(Sparky.filters, {
		"number-to-note": function(value) {
			if (typeof value !== 'number') { return; }
			return music.numberToNote(value);
		},

		"number-to-note-name": function(value) {
			if (typeof value !== 'number') { return; }
			return music.numberToNote(value).replace(rtrailingnumber, '');
		},

		"number-to-note-octave": function(value) {
			if (typeof value !== 'number') { return; }
			return music.numberToOctave(value);
		},

		"number-to-frequency": function(value) {
			if (typeof value !== 'number') { return; }
			return music.numberToFrequency(value);
		}
	});
})(window);