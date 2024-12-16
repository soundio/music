export default {
    // Property names to ignore when listing enumerable params and properties
    // of an AudioNode
    context: true,
    numberOfInputs: true,
    numberOfOutputs: true,
    channelCount: true,
    channelCountMode: true,
    channelInterpretation: true,
    connect: true,
    disconnect: true,
    addEventListener: true,
    dispatchEvent: true,
    removeEventListener: true,
    // Just for AnalyserNode, maybe devise a better place
    frequencyBinCount: true
};
