import { add, subtract, multiply, magnitude } from './vector.js';

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
        let e = multiply(exponent(k, N), X_odds[k]);

        X[k] = add(e, t);
        X[k + (N / 2)] = subtract(e, t);
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
