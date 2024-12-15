export function isParam(object) {
    return window.AudioParam && AudioParam.prototype.isPrototypeOf(object);
}
