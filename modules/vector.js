/*
Chored fae https://github.com/vail-systems/node-fft/blob/master/src/complex.js.
*/

//-------------------------------------------------
// Add two complex numbers
//-------------------------------------------------
export function add(b, a) {
    return [a[0] + b[0], a[1] + b[1]];
}

//-------------------------------------------------
// Subtract two complex numbers
//-------------------------------------------------
export function subtract(b, a) {
    return [a[0] - b[0], a[1] - b[1]];
}

//-------------------------------------------------
// Multiply two complex numbers
//
// (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
//-------------------------------------------------
export function multiply(b, a) {
    return [(a[0] * b[0] - a[1] * b[1]),
            (a[0] * b[1] + a[1] * b[0])];
}

//-------------------------------------------------
// Calculate |a + bi|
//
// sqrt(a*a + b*b)
//-------------------------------------------------
export function magnitude(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}

export function angle(vector) {
    return Math.atan2(vector[1], vector[0]);
}






const assign = Object.assign;
const define = Object.defineProperties;

/* Vector2 */

function Vector2() {

}

assign(Vector2, {
    of: function() {
        return new Vector2(arguments);
    },

    from: function(data) {
        return new Vector2(data);
    }
});

define(Vector2.prototype, {
    x: {
        get: function() {
            return this[0] === undefined ?
                (this[0] = this[2] * Math.acos(this[3])) :
                this[0] ;
        },

        set: function(value) {
            if (value === this[0]) return;
            // Access y to make sure its value is up-to-date before erasing d,a
            this.y;
            this[0] = value;
            this[2] = undefined;
            this[3] = undefined;
        },

        enumerable: true
    },

    y: {
        get: function() {
            return this[1] === undefined ?
                (this[1] = this[2] * Math.asin(this[3])) :
                this[1] ;
        },

        set: function(value) {
            if (value === this[1]) return;
            // Access x to make sure its value is up-to-date before erasing d,a
            this.x;
            this[1] = value;
            this[2] = undefined;
            this[3] = undefined;
        },

        enumerable: true
    },

    r: {
        get: function() {
            return this[2] === undefined ?
                (this[2] = Math.pow(this[0] * this[0] + this[1] * this[1], 0.5)) :
                this[2] ;
        },

        set: function(value) {
            if (value === this[2]) return;
            // Access a to make sure its value is up-to-date
            this.a;
            this[2] = value;
            // Erase x,y
            this[0] = undefined;
            this[1] = undefined;
        },

        enumerable: true
    },

    a: {
        get: function() {
            return this[3] === undefined ?
                (this[3] = Math.atan2(this[1], this[0])) :
                this[3] ;
        },

        set: function(value) {
            if (value === this[3]) return;
            // Access d to make sure its value is up-to-date
            this.d;
            this[3] = wrap(0, 2 * Math.PI, value);
            // Erase x,y
            this[0] = undefined;
            this[1] = undefined;
        },

        enumerable: true
    }
});

assign(Vector2.prototype, {

});
