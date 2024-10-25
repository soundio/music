
export default function mix(object1, object2) {
    const descriptors = Object.getOwnPropertyDescriptors(object2);
    // Get descriptors excluding constructor
    const { constructor, ...properties } = descriptors;
    // Define properties on object1
    return Object.defineProperties(object1, properties);
}
