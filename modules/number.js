
/**
toFixedPrecision(n, number)
Returns the shorter of `n.toFixed()` and `n.Precision()`.
**/

export function toFixedPrecision(n, number) {
    const abs = Math.abs(number);
    if (abs === Infinity) return number < 0 ? '-∞' : '∞';

    // Order of magnitude
    const order = Math.pow(10, n);
    // toPrecision() spits out scientific notation for numbers greater than
    // order - avoid that
    if (abs >= order) return Math.round(number) + '';

    const fixed   = number.toFixed(n);
    const precise = number.toPrecision(n);
    return fixed.length < precise.length ? fixed : precise ;
}

/**
toMetricPrecision(number)
Returns the shorter of `n.toFixed()` and `n.Precision()` of a metric multiple
of `number`, postfixing a 'μ', 'm', 'k' or 'M' where applicable.
**/

export function toMetricPrecision(number) {
    const abs = Math.abs(number);
    return abs === 0 ? number :
        abs === Infinity ? number < 0 ? '-∞' : '∞' :
        abs < 0.001 ? toFixedPrecision(3, number * 1000000) + 'μ' :
        abs < 1        ? toFixedPrecision(3, number * 1000) + 'm' :
        abs < 1000     ? toFixedPrecision(3, number) + '' :
        abs < 1000000  ? toFixedPrecision(3, number / 1000) + 'k' :
        toFixedPrecision(3, abs / 1000000) + 'M' ;
}
