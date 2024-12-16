
import delegate    from 'dom/delegate.js';
import events      from 'dom/events.js';
import Literal     from 'literal/module.js';
import { isParam } from '../modules/param.js';
import { configs } from '../modules/constructors.js';
import { isReadOnlyProperty } from '../modules/property.js';
// Make param templates available in Literal
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

assign(Literal.scope, {
    delegate,
    events,
    configs,
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
    ),
    isReadOnlyProperty
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
                    if (param.signal) param.signal.invalidate();
                }
                else {
                    data[input.name] = value;
                }
            },
            '[type="text"], [type="radio"], select': (input, e) => data[input.name] = input.value,
            '[type="checkbox"]': (input, e) => data[input.name] = input.checked,
        })) }

        $\{ ((node, includes) => {
            // Use a for in loop because we want all enumerable properties, not
            // only own enumerable properties
            for (let name in node) if (isParamOrProperty(name, node)) {
                const constructor = node.constructor.name;
                const config = assign({ node, name }, configs[constructor] && configs[constructor][name]);
                let readonly;

                // Give param a signal
                if (isParam(node[name]) && !node[name].signal) {
                    node[name].signal = Signal.fromProperty('value', node[name]);
                }
                // Test property for read-only-ness
                else {
                    readonly = isReadOnlyProperty(name, node);
                }

                includes.push(
                    readonly ? include('property-readonly', config) :
                    // A DOM element, display its id
                    node[name] instanceof Element ? include('property-element', config) :
                    // An AudioParam or settings object
                    typeof node[name] === 'object' ?
                        isParam(node[name]) ?
                        include('param',           config) :
                        include('property-object', config) :
                    // It has config and config is an array
                    config && config.values ?
                        config.values.length < 4 ?
                        include('property-radio',  config) :
                        include('property-option', config) :
                    // It's a primitive
                    typeof node[name] === 'number'  ? include('property-number',  config) :
                    typeof node[name] === 'string'  ? include('property-string',  config) :
                    typeof node[name] === 'boolean' ? include('property-boolean', config) :
                    printError('Literal template "node" cannot render property "' + name + '"')
                );
            }
            return includes;
        })(DATA, []) }
    </form>
`);
