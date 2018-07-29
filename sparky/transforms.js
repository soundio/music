import transforms from '../../sparky/js/transforms.js';
import { numberToNote, numberToOctave, numberToFrequency } from '../module.js';

var assign = Object.assign;
var rtrailingnumber = /\d+$/;

assign(transforms, {
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
