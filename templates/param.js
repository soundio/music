/*
AudioParam.defaultValue
AudioParam.maxValue
AudioParam.minValue
AudioParam.value

Wraning: maxValue and minValue are not useful to us, they represent the max and
min possible 32-bit floating point values. We need a means of getting sensible
default min and max values. I can't think of another way other than buy name
right now. It's not ideal.
*/

import NormalInput from 'forms/normal-input/element.js';
import toGain      from 'fn/to-gain.js';
import Literal     from 'literal/module.js';

const assign = Object.assign;
const defaults = {
    gain:        { min: 0, max: toGain(6), law: 'log-24db' },
    minDecibels: { min: -96, max: 0 },
    maxDecibels: { min: -96, max: 0 },
};

assign(Literal.scope, { defaults,
    toSpaceCase: function(camelCase) {
        return camelCase.replace(/[A-Z]/g, ($0) => ' ' + $0.toLowerCase());
    }
});

export default Literal.compileHTML('param', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="range"
        is="normal-input"
        name="$\{ DATA.name }"
        min="$\{ DATA.min !== undefined ? DATA.min : defaults[DATA.name] && defaults[DATA.name].min }"
        max="$\{ DATA.max !== undefined ? DATA.max : defaults[DATA.name] && defaults[DATA.name].max }"
        value="$\{ DATA.param.value }"
        law="$\{ DATA.law || defaults[DATA.name] && defaults[DATA.name].law }"
        step="any"
        id="$\{ DATA.name }"
    />
    <output for="$\{ DATA.name }">$\{ data.param.value }</output>
</div>`);

export const propertyElement = Literal.compileHTML('property-element', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <input type="text"
        name="$\{ DATA.name }"
        value="$\{ '#' + data.element.id }"
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
    <input type="range"
        name="$\{ DATA.name }"
        min="$\{ DATA.min !== undefined ? DATA.min : 0 }"
        max="$\{ DATA.max !== undefined ? DATA.max : 1 }"
        value="$\{ data.node[DATA.name] }"
        law="$\{ DATA.law || (defaults[DATA.name] && defaults[DATA.name].law) || 'linear' }"
        step="$\{ DATA.step || 'any' }"
        id="$\{ DATA.name }"
    />
    <output for="$\{ DATA.name }">$\{ data.node[DATA.name] }</output>
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
        $\{ DATA.options.map((value) => include('option', { value })) }
    </select>
</div>`);

Literal.compileHTML('radio', `
    <input class="invisible"
        type="radio"
        name="$\{ DATA.name }"
        value="$\{ DATA.value }"
        checked="$\{ data.data.node[DATA.data.name] === DATA.value }"
        id="$\{ DATA.data.name + '-' + DATA.value }" />
    <label class="radio-label" for="$\{ DATA.data.name + '-' + DATA.value }">$\{ DATA.value }</label>
`);

export const propertyRadio = Literal.compileHTML('property-radio', `<div class="line-param-grid param-grid grid">
    <label for="$\{ DATA.name }">$\{ DATA.label || toSpaceCase(DATA.name) }</label>
    <div class="radio-flex flex">
        $\{ DATA.options.map((value) => include('radio', { value, data: DATA })) }
    </div>
</div>`);
