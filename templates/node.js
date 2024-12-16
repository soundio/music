
import toGain      from 'fn/to-gain.js';
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


/* Generic (default) node template */

export default Literal.compileHTML('node', `
    <form class="node-form" data-number-of-inputs="$\{ DATA.numberOfInputs }" data-number-of-outputs="$\{ DATA.numberOfOutputs }" data-channel-count="$\{ DATA.channelCount }" data-channel-count-mode="$\{ DATA.channelCountMode }" data-channel-interpretation="$\{ DATA.channelInterpretation }">
        <h4>$\{ DATA.constructor.name }</h4>

        $\{ ((node, includes) => {
            const constructor = node.constructor.name;

            // Use a for in loop because we want all enumerable properties, not
            // only own enumerable properties
            for (let name in node) if (isParamOrProperty(name, node)) {
                const data = assign({ node, name }, configs[constructor] && configs[constructor][name]);

                // Is it an AudioParam?
                if (isParam(node[name])) {
                    const param = node[name];
                    // Give it a signal
                    if (!param.signal) param.signal = Signal.fromProperty('value', param);
                    // Add its template to includes
                    includes.push(include('param', data));
                    continue;
                }

                // Add its template to includes
                includes.push(
                    // Test property for readonly-ness
                    isReadOnlyProperty(name, node) ? include('property-readonly', data) :
                    // A DOM element, display its id
                    node[name] instanceof Element ? include('property-element', data) :
                    // A settings object
                    typeof node[name] === 'object' ? include('property-object', data) :
                    // It has a list of possible values
                    data && data.values ?
                        data.values.length < 4 ?
                        include('property-radio',  data) :
                        include('property-option', data) :
                    // It's a primitive
                    typeof node[name] === 'number'  ? include('property-number',  data) :
                    typeof node[name] === 'string'  ? include('property-string',  data) :
                    typeof node[name] === 'boolean' ? include('property-boolean', data) :
                    printError('Literal template "node" cannot render property "' + name + '"')
                );
            }
            return includes;
        })(DATA, []) }
    </form>
`);


/* Gain node template override */

export const gain = Literal.compileHTML('node', `
<style>
:host { width: 1.875rem !important; }
.ui-block { width: 1.875rem; }
.node-form { width: 1.875rem; padding-bottom: 0.5625rem; }
.fader-input { display: block; }
output { display: block; font-size: 0.6875em; text-align: center; width: 100%; color: #666666; }
</style>
<form class="node-form" data-number-of-inputs="$\{ DATA.numberOfInputs }" data-number-of-outputs="$\{ DATA.numberOfOutputs }" data-channel-count="$\{ DATA.channelCount }" data-channel-count-mode="$\{ DATA.channelCountMode }" data-channel-interpretation="$\{ DATA.channelInterpretation }">
    $\{ ((node, includes) => {
        const constructor = node.constructor.name;
        const param = node.gain;
        const data  = assign({}, configs[constructor] && configs[constructor][name], {
            node, param,
            name: 'gain',
            min:  0,
            max:  toGain(6),
            law:  'log-18db',
            display: 'db',
            unit: 'dB'
        });

        // Give it a signal
        if (!param.signal) param.signal = Signal.fromProperty('value', param);

        // Include its template
        return include('param-fader', data);
    })(DATA, []) }
</form>
`);
