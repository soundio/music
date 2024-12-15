
import delegate     from 'dom/delegate.js';
import events       from 'dom/events.js';
import Literal      from 'literal/module.js';
import { isParam }  from '../modules/param.js';
import './param.js';

const assign = Object.assign;
const blacklist = {
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

const nodeOptions = {
    AnalyserNode: {
        fftSize: [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768],
    },

    BiquadFilterNode: {
        type: ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass']
    },

    OscillatorNode: {
        type: ["sine", "square", "sawtooth", "triangle", "custom"]
    },

    PannerNode: {
        panningModel:  ['equalpower', 'HRTF'],
        distanceModel: ['linear', 'inverse', 'exponential']
    },

    WaveShaperNode: {
        oversample: ['none', '2x', '4x']
    }
};

assign(Literal.scope, {
    delegate,
    events,
    nodeOptions,
    isParam,
    isParamOrProperty: (name, node) => (
        // Reject blacklistd properties
        !blacklist[name]
        // Reject methods
        && typeof node[name] !== 'function'
        // Reject callback method properties, which are null on initialisation
        && !name.startsWith('on')
        // Reject null ????
        && node[name] !== null
        // Reject Float32Arrays
        && !(node[name] && node[name].constructor.name === 'Float32Array')
    )
});

export default Literal.compileHTML('node', `
    <form class="node-form" data-number-of-inputs="$\{ DATA.numberOfInputs }" data-number-of-outputs="$\{ DATA.numberOfOutputs }" data-channel-count="$\{ DATA.channelCount }" data-channel-count-mode="$\{ DATA.channelCountMode }" data-channel-interpretation="$\{ DATA.channelInterpretation }">
        <h4>$\{ DATA.constructor.name }</h4>

        $\{ events('input', element).each(delegate({
            '[type="range"]': (input, e) => {
                const value = parseFloat(input.value);
                if (isParam(DATA[input.name])) {
                    const context = DATA.context;
                    const param   = DATA[input.name];
                    param.setValueAtTime(value, context.currentTime);
                }
                else {
                    data[input.name] = value;
                }
            },
            '[type="text"], select': (input, e) => data[input.name] = input.value,
            '[type="checkbox"]':     (input, e) => data[input.name] = input.checked
        })) }

        $\{ ((node, includes) => {
            // Use a for in loop because we want all enumerable properties, not
            // only own enumerable properties
            for (let name in node) if (isParamOrProperty(name, node)) includes.push(
                // A DOM element, display its id
                node[name] instanceof Element ? include('property-element', { node, name, element: node[name] }) :
                // An AudioParam or settings object
                typeof node[name] === 'object' ?
                    isParam(node[name]) ? include('param', { node, name, param: node[name] }) :
                    include('property-object', { node, name }) :
                // It has config in nodeOptions
                nodeOptions[node.constructor.name] && nodeOptions[node.constructor.name][name] ?
                    nodeOptions[node.constructor.name][name].length < 4 ?
                        include('property-radio', { node, name, options: nodeOptions[node.constructor.name][name] }) :
                    include('property-option', { node, name, options: nodeOptions[node.constructor.name][name] }) :
                // It's a primitive
                typeof node[name] === 'number'  ? include('property-number',  { node, name }) :
                typeof node[name] === 'string'  ? include('property-string',  { node, name }) :
                typeof node[name] === 'boolean' ? include('property-boolean', { node, name }) :
                printError('Literal template "node" cannot render property "' + name + '"')
            );
            return includes;
        })(DATA, []) }
    </form>
`);
