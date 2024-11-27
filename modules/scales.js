import { modes } from './harmony.js';


/**
scales(maxRange, maxLength, maxInterval)

Create scale arrays containing groups of notes from a single note (`[0]`) up to
an array of length `maxLength` where the highest note is limited by `maxRange`
and  all interior intervals are less than `maxInterval`.
**/

function createScales(scales, scale, range, length, maxInterval) {
    let l = scale.length;
    let i = scale[l - 1];

    while(++i < range && (i - scale[l - 1]) < maxInterval) {
        scale[l] = i;
        scales.push({
            scale: scale.slice()
        });

        if (scale.length < length) {
            ting(scales, scale, range, length, maxInterval);
            scale.length = l + 1;
        }
    }

    return scales;
}

function scales(range = 6, length = 4, maxInterval = 12) {
    const scales = [];
    const scale  = [0];
    scales.push(scale.slice());
    return createScales(scales, scale, range, length, maxInterval);
}
