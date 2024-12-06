import { add, subtract, multiply } from './vector.js';

const INT_BITS = 32;


/*
ctz(n)
Counts trailing zeros in the 32-bit representation of number `n`.
Nicked from https://github.com/mikolalysenko/bit-twiddle/blob/master/twiddle.js.
*/
/*
function ctz(v) {
    var c = 32;
    v &= -v;
    if (v) c--;
    if (v & 0x0000FFFF) c -= 16;
    if (v & 0x00FF00FF) c -= 8;
    if (v & 0x0F0F0F0F) c -= 4;
    if (v & 0x33333333) c -= 2;
    if (v & 0x55555555) c -= 1;
    return c;
}
*/

/*
reverse(n)
Reverse bits in 32-bit word `n`.
Nicked from https://github.com/mikolalysenko/bit-twiddle/blob/master/twiddle.js.
*/
/*
const REVERSE_TABLE = new Array(256);

for(let i = 0; i < 256; ++i) {
    let v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
        r <<= 1;
        r |= v & 1;
        --s;
    }
    REVERSE_TABLE[i] = (r << s) & 0xff;
}

function reverse(n) {
    return (REVERSE_TABLE[n & 0xff]       << 24) |
        (REVERSE_TABLE[(n >>> 8) & 0xff]  << 16) |
        (REVERSE_TABLE[(n >>> 16) & 0xff] << 8)  |
         REVERSE_TABLE[(n >>> 24) & 0xff];
}
*/

/* exponent()
By Eulers Formula: `e^(i*x) = cos(x) + i*sin(x)` and in DFT: `x = -2*PI*(k/N)`.
Nicked from https://github.com/vail-systems/node-fft/blob/master/src/fftutil.js.
*/

const cache = {};

function exponent(k, n) {
      var x = -2 * Math.PI * (k / n);
      cache[n] = cache[n] || {};
      cache[n][k] = cache[n][k] || [Math.cos(x), Math.sin(x)]; // [Real, Imaginary]
      return cache[n][k];
}

function even(__, ix) {
    return ix % 2 === 0;
}

function odd(__, ix) {
    return ix % 2 === 1;
}

export default function fft(vector) {
    const X = [];
    const N = vector.length;

    // Base case is X = x + 0i since our input is assumed to be real only.
    if (N == 1) {
        //If input vector contains complex numbers
        return Array.isArray(vector[0]) ?
            [[vector[0][0], vector[0][1]]] :
            [[vector[0], 0]] ;
    }

    // Recurse: all even samples
    const X_evens = fft(vector.filter(even));

    // Recurse: all odd samples
    const X_odds  = fft(vector.filter(odd));

    // Now, perform N/2 operations!
    for (let k = 0; k < N / 2; k++) {
        // t is a complex number!
        let t = X_evens[k];
        let e = exponent(k, N)
        let c = multiply(e, X_odds[k]);
        X[k] = add(c, t);
        X[k + (N / 2)] = subtract(c, t);
    }

    return X;
}

export function ifft(signal){
    //Interchange real and imaginary parts
    var csignal=[];
    for(var i=0; i<signal.length; i++){
        csignal[i]=[signal[i][1], signal[i][0]];
    }

    //Apply fft
    var ps = fft(csignal);

    //Interchange real and imaginary parts and normalize
    var res=[];
    for(var j=0; j<ps.length; j++){
        res[j]=[ps[j][1]/ps.length, ps[j][0]/ps.length];
    }
    return res;
}


/**
fft(samples)
Where `samples` is a Float32Array of samples.

fft(vectors, size, offset)
Where `vectors` is a Float32Array of complex numbers `[rn, in, ...]`  where `rn`
and `in` are real and imaginary parts, `size` is the number of indexes between
vectors to read (must be 2^n), and `offset` is the offset of the first vector to
read.
**/
/*
function createSharedArray(array, n = 0, length = array.length - n) {
    // Create a typed array that shares the buffer of array
    const TypedArray = array.constructor;
    return new TypedArray(
        array.buffer,
        n * TypedArray.BYTES_PER_ELEMENT,
        length
    );
}
*/

const vector = [0, 0];

/*
function add2(bx, by, ax, ay) {
    vector[0] = ax + bx;
    vector[1] = ay + by;
    return vector;
}

function subtract2(bx, by, ax, ay) {
    vector[0] = ax - bx;
    vector[1] = ay - by;
    return vector;
}
*/
function multiply2(ax, ay, bx, by) {
    vector[0] = ax * bx - ay * by;
    vector[1] = ax * by + ay * bx;
    return vector;
}

const cache2 = {};

function exponent2(k, n) {
    const x = -2 * Math.PI * k / n;
    const vectors = cache2[n] || (cache2[n] = {});
    return vectors[k] || (vectors[k] = [Math.cos(x), Math.sin(x)]) ;
}


export function fft2(vectors, size = 1, offset = 0, buffer) {
    // Return same array type as vectors by getting its constructor
    const TypedArray = vectors.constructor;

    if (size === 1) {
        // Convert a 1D array of samples to a 2D array of complex numbers
        // `[x, 0, ...]`, the sample as the real part and 0 as the imaginary part.
        const samples = vectors;
        let n = samples.length;
        size    = 2;
        vectors = new TypedArray(size * n);
        while (n--) vectors[size * n] = samples[n];
    }

    // Sanity check
    if (window.DEBUG && offset >= size) throw new Error('fft() offset cannot be greater than size');

    const length = vectors.length / size;
    if (length === 1) return TypedArray.BYTES_PER_ELEMENT ?
        new TypedArray(
            vectors.buffer,
            offset * TypedArray.BYTES_PER_ELEMENT,
            2
        ) :
        [vectors[offset], vectors[offset + 1]] ;

    const phasors = buffer || new TypedArray(length * 2);
    const evens   = fft2(vectors, size * 2, offset);
    const odds    = fft2(vectors, size * 2, size + offset);

    // Perform length / 2 operations
    let n = -1;
    let i, i1, i2, ax, ay, bx, by, cx, cy, ex, ey;
    while (++n < length / 2) {
        i  = n * 2;
        ax = evens[i];
        ay = evens[i + 1];
        bx = odds[i];
        by = odds[i + 1];
        [ex, ey] = exponent2(n, length);
        [cx, cy] = multiply2(ex, ey, bx, by);

        // Add a + c
        phasors[i]     = ax + cx;
        phasors[i + 1] = ay + cy;

        // Subtract a - c
        phasors[i + length]     = ax - cx;
        phasors[i + length + 1] = ay - cy;
    }

    return phasors;
}

export function ifft2(vectors, buffer = new vectors.constructor(vectors.length)) {
    if (window.DEBUG && typeof buffer !== 'object') throw new Error('ifft() buffer must be an Array or TypedArray');

    const length = vectors.length;

    // Read into buffer swapping real and imaginary parts
    let n = length;
    while (n) {
        buffer[--n] = vectors[n - 1];
        buffer[--n] = vectors[n + 1];
    }

    // Apply FFT to 2-dimensional buffer
    const phasors = fft2(buffer, 2);

    // Read into buffer, swap real and imaginary parts and normalise
    n = length;
    while (n) {
        buffer[--n] = phasors[n - 1] * 2 / length;
        buffer[--n] = phasors[n + 1] * 2 / length;
    }

    return buffer;
}
