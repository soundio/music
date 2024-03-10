
/**
intersect(a, b)
A fast intersect that assumes `a` and `b` are arrays of sorted (ascending)
numbers.
**/

export default function intersect(arr1, arr2) {
    var l1 = arr1.length, l2 = arr2.length,
        i1 = 0, i2 = 0,
        arr3 = [];

    while (i1 < l1 && i2 < l2) {
        if (arr1[i1] === arr2[i2]) {
            arr3.push(arr1[i1]);
            ++i1;
            ++i2;
        }
        else if (arr2[i2] > arr1[i1]) {
            ++i1;
        }
        else {
            ++i2;
        }
    }

    return arr3;
}
