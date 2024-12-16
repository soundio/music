/*
AudioParam.defaultValue
AudioParam.maxValue
AudioParam.minValue
AudioParam.value

Warning: maxValue and minValue are not useful to us, they represent the max and
min possible 32-bit floating point values. We need a means of getting sensible
default min and max values. I can't think of another way other than buy name
right now. It's not ideal.
*/

import NormalInput from 'forms/normal-input/element.js';
import toGain      from 'fn/to-gain.js';
import Literal     from 'literal/module.js';
import { toMetricPrecision, toFixedPrecision } from '../modules/number.js';

const assign = Object.assign;

assign(Literal.scope, {
    toFixedPrecision,
    toMetricPrecision,
    toSpaceCase: function(camelCase) {
        return camelCase.replace(/[A-Z]/g, ($0) => ' ' + $0.toLowerCase());
    }
});

export default Literal.compileHTML('param', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="range" is="normal-input"
        name="$\{ DATA.name }"
        min="$\{ DATA.min !== undefined ? DATA.min : 0 }"
        max="$\{ DATA.max !== undefined ? DATA.max : 1 }"
        value="$\{
            // AudioParam is not proxyable. We read signal to bind this template to value
            DATA.node[DATA.name].signal.value
        }"
        law="$\{ DATA.law }"
        step="$\{ DATA.step || 'any' }"
        id="$\{ DATA.name }"
    />
    <output for="$\{ DATA.name }">$\{ DATA.unit ?
        toMetricPrecision(
            DATA.display === 'db' ? todB(DATA.node[DATA.name].signal.value || 0) :
            DATA.node[DATA.name].signal.value || 0
        ) :
        toFixedPrecision(3,
            DATA.display === 'db' ? todB(DATA.node[DATA.name].signal.value || 0) :
            DATA.node[DATA.name].signal.value || 0
        ) }<abbr class="unit-abbr" hidden="$\{ !DATA.unit }">$\{ DATA.unit }</abbr></output>
</div>`);

export const paramFader = Literal.compileHTML('param-fader', `
<input type="range" is="normal-input" class="fader-input vertical" name="$\{ DATA.name }" min="$\{ DATA.min !== undefined ? DATA.min : 0 }" max="$\{ DATA.max !== undefined ? DATA.max : 1 }" law="$\{ DATA.law }" value="$\{ DATA.node[DATA.name].signal.value }" step="any" id="$\{ DATA.name }"/>
<output for="$\{ DATA.name }">$\{
    toFixedPrecision(2,
        DATA.display === 'db' ? todB(DATA.node[DATA.name].signal.value || 0) :
        DATA.node[DATA.name].signal.value || 0
    ) }<abbr class="unit-abbr" hidden="$\{ !DATA.unit }">$\{ DATA.unit }</abbr>
</output>
`);

export const propertyElement = Literal.compileHTML('property-element', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="text"
        name="$\{ DATA.name }"
        value="$\{ '#' + data.node[DATA.name].id }"
        id="$\{ DATA.name }"
        readonly
    />
</div>`);

export const propertyObject = Literal.compileHTML('property-object', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <pre class="wrap" style="white-space: wrap;">$\{ JSON.stringify(data.node[DATA.name]) }</pre>
</div>`);

export const propertyNumber = Literal.compileHTML('property-number', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="range" is="normal-input"
        name="$\{ DATA.name }"
        min="$\{ DATA.min !== undefined ? DATA.min : 0 }"
        max="$\{ DATA.max !== undefined ? DATA.max : 1 }"
        value="$\{ data.node[DATA.name] }"
        law="$\{ DATA.law }"
        step="$\{ DATA.step || 'any' }"
        id="$\{ DATA.name }"
    />
    <output for="$\{ DATA.name }">$\{ DATA.unit ?
        toMetricPrecision(data.node[DATA.name] || 0) :
        toFixedPrecision(3, data.node[DATA.name] || 0) }<abbr class="unit-abbr" hidden="$\{ !DATA.unit }">$\{ DATA.unit }</abbr></output>
</div>`);

export const propertyReadonly = Literal.compileHTML('property-readonly', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="text"
        name="$\{ DATA.name }"
        value="$\{ data.node[DATA.name] }"
        id="$\{ DATA.name }"
        readonly
    />
</div>`);

export const propertyString = Literal.compileHTML('property-string', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="text"
        name="$\{ DATA.name }"
        value="$\{ data.node[DATA.name] }"
        id="$\{ DATA.name }"
    />
`);

export const propertyBoolean = Literal.compileHTML('property-boolean', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="checkbox"
        name="$\{ DATA.name }"
        checked="$\{ data.node[DATA.name] }"
        id="$\{ DATA.name }"
    />
</div>`);

Literal.compileHTML('option', `<option value="$\{ DATA.value }">$\{ DATA.value }</option>`);

export const propertyOption = Literal.compileHTML('property-option', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <select name="$\{ DATA.name }" value="$\{ data.node[DATA.name] }" id="$\{ DATA.name }">
        $\{ DATA.values.map((value) => include('option', { value })) }
    </select>
</div>`);

Literal.compileHTML('radio', `
    <input class="invisible"
        type="radio"
        name="$\{ DATA.data.name }"
        value="$\{ DATA.value }"
        checked="$\{ data.data.node[DATA.data.name] === DATA.value }"
        id="$\{ DATA.data.name + '-' + DATA.value }" />
    <label class="radio-label" for="$\{ DATA.data.name + '-' + DATA.value }">$\{ DATA.value }</label>
`);

export const propertyRadio = Literal.compileHTML('property-radio', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <div class="radio-flex flex">
        $\{ DATA.values.map((value) => include('radio', { value, data: DATA })) }
    </div>
</div>`);
