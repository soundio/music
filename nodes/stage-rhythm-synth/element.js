/** <stage-rhythm-synth> **/

import RotaryInput  from 'form/rotary-input/element.js';

import delegate     from 'dom/delegate.js';
import element      from 'dom/element.js';
import events       from 'dom/events.js';
import Data         from 'fn/data.js';
import Signal       from 'fn/signal.js';
import { getScale } from 'form/modules/law.js';
import Literal      from 'literal/module.js';
import Event        from 'soundstage/event.js';
import setupDataLawAttribute from 'bolt/attributes/data-law.js';
import RhythmSynth  from './module.js';
import presets      from './presets.js';
import { shadow, construct, connect, properties } from '../stage-node/module.js';
import { plotYAxis, plotWaveform, plotMeter } from '../../modules/canvas.js';


const assign = Object.assign;


// Extend Literal scope
import * as consts from 'form/modules/constants.js';
import 'literal/scope.js';
import dB from 'fn/to-db.js';
import toGain from 'fn/to-gain.js';
import normalise from 'fn/normalise.js';
import denormalise from 'fn/denormalise.js';

assign(Literal.scope, consts, { dB, toGain, law: getScale('log-24db'), normalise, denormalise });


// Templates

const eventInput = Literal.compileHTML('event-input', `
    <input class="y1 square-mono-input mono-input yellow-fg" type="range" name="event-$\{ data.i }-gain" min="0" max="1.2" data-law="log-24db" step="any" value="$\{ element.$event = data.event, console.log(data.event[3], law.normalise(0, 1, data.event[3]), denormalise(0, 1, law.normalise(0, 1, data.event[3]))), denormalise(0, 1, law.normalise(0, 1, data.event[3])) }" title="$\{ dB(data.event[3]).toPrecision(3) + 'dB' }" id="event-$\{ data.i }-gain" style="left: calc(100% * $\{ data.event[0] / data.node.duration });" />
`);

const eventsBlock = Literal.compileHTML('events', `
    <div class="events-block block">
        $\{ data.node.events
            .filter((event) => event[1] === 'start' && event[0] < data.node.duration)
            .map((event, i) => include('event-input', { i, event, node: DATA.node })) }
    </div>
`);

const harmonic = Literal.compileHTML('harmonic', `
    <label class="y2 center-align text-10 darklime-fg" for="harmonic-$\{ DATA.n }-magnitude" style="grid-column: $\{ DATA.n + 1 }; margin-top: 0; padding: 0; min-height: 0; $\{ data.node.wave.duration === DATA.n ? 'font-weight: bold;' : '' } color: $\{ data.node.wave.gainAt(DATA.n) <= data.node.wave.gate ? 'black' : 'var(--darklime)' };">$\{ DATA.n }</label>
    <input class="y1 mono-input $\{ data.node.wave.gainAt(DATA.n) <= data.node.wave.gate ? 'black-fg' : 'lime-fg' }" type="range" name="harmonic-$\{ DATA.n }-magnitude" min="0" max="$\{ DATA.max }" data-law="log-24db" step="any" value="$\{ data.node.wave.magnitudeAt(DATA.n) }" title="$\{ /* REMEMBER WRITING DIRECTION IS SCRWED UP */ data.node.wave.gainAt(DATA.n) < dB96 ? '-∞dB' : dB(data.node.wave.gainAt(DATA.n)).toPrecision(3) + 'dB' }" id="harmonic-$\{ DATA.n }-magnitude" style="grid-column: $\{ DATA.n + 1 }; margin: 0 auto;" />
    <rotary-input class="y3 mono-input $\{ data.node.wave.gainAt(DATA.n) <= data.node.wave.gate ? 'black-fg' : 'lime-fg' }" style="grid-column: $\{ DATA.n + 1 };" name="harmonic-$\{ DATA.n }-phase" min="0" max="${ 2 * Math.PI }" wrap step="any" value="$\{ wrap(0, 2 * PI, data.node.wave.phaseAt(DATA.n)) }" hidden="$\{ data.node.wave.magnitudeAt(DATA.n) === 0 }" />
`);

const harmonics = Literal.compileHTML('harmonics', `
    <div class="harmonics-grid grid" style="--x-gap: 0.1875rem; --y-gap: 0.1875rem; padding: 0.25rem 0.25rem;">
        $\{ Array.from({ length: 33 }, (v, n) => assign({ n, max: n ? 0.25 * DATA.node.wave.size / n : 0.5 * DATA.node.wave.size }, DATA)).map(include('harmonic')) }
        <label class="y2 center-align text-10" for="gate-magnitude" style="grid-column: 34; margin-top: 0; padding: 0; min-height: 0;">Gate</label>
        <input class="y1 mono-input" type="range" name="gate-magnitude" min="0" max="1" data-law="log-24db" step="any" value="$\{ data.node.wave.gate }" style="grid-column: 34;" id="gate-magnitude" />
        <button class="x1 6x y4 button" type="button" name="harmonics-gain" value="0">Zero magnitudes</button>
        <button class="x7 6x y4 button" type="button" name="harmonics-phase" value="0">Zero phases</button>
    </div>
`);


function draw(canvas, ctx, box, node, samples, data, waveform) {
    const { width, height } = canvas;
    const { phasors }       = waveform;

    // Get data from the 0th and the following 32 harmonics
    const length     = 33;
    const magnitudes = new Float32Array(length);
    const angles     = new Float32Array(length);

    let n = length;
    while (n--) {
        angles[n]     = phasors[n * 2 + 1];
        magnitudes[n] = phasors[n * 2];
    }

    ctx.clearRect(0, 0, width, height);

    // Plot phase angles
    plotWaveform(ctx, [0, 0.5 * height, width, (-0.4/Math.PI) * height], angles, { strokeStyle: '#617316' });
    // Plot axes
    plotYAxis(ctx, box);
    // Plot beat grid
    plotMeter(ctx, box, node.duration, node.events);
    // Plot waveform
    plotWaveform(ctx, box, samples, { strokeStyle: 'white' });
}

export default element('<stage-rhythm-synth>', {
    mode: 'open',

    shadow: shadow + `
        <link rel="stylesheet" href="${ window.rhythmSynthStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>Rhythm Synth</h4>
        <div class="ui-block block">
            <canvas width="1024" height="512" class="block"></canvas>
        </div>
    `,

    construct: function(shadow, internals) {
        construct.apply(this, arguments);

        const menu   = shadow.querySelector('file-menu');
        const canvas = shadow.querySelector('canvas');
        const ctx    = canvas.getContext('2d');
        const box    = [0, 0.5 * canvas.height, canvas.width, -0.4 * canvas.height];

        assign(internals, {
            canvas, ctx, box,
            ui: shadow.querySelector('.ui-block'),
            consts: { shadow, host: this }
        });

        // Add presets to settings menu
        presets.forEach((preset) => menu.createPreset(preset.name, preset));

        // Listen for interaction
        events('change', menu).each((e) => assign(Data.of(this.node), e.target.data));

        events('input', shadow).each(delegate({
            // Respond to event inputs
            '[name^="event-"][name$="-gain"]': (input, e) => {
                // input.$event is set in the value attribute, input.outputValue
                // is set by data-law
                const event  = input.$event;
                const value  = input.outputValue;
                //const normal = parseFloat(input.value);
                //const value  = law.denormalise(0, 1, normal);
console.log(this.node.events.includes(Data.objectOf(event)));
console.log(this.node.events.includes(event));
                event[3] = value;
            },

            // Respond to magnitude inputs
            '[name^="harmonic-"][name$="-magnitude"]': (input, e) => {
                const wave   = this.node.wave;
                const data   = Data.of(wave);
                const n      = parseInt(input.name.slice(9), 10);
                const i0     = n * 2;
                const i2     = (0.5 * wave.phasors.length - n) * 2;
                const max    = n ? 0.25 * wave.phasors.length / n : 0.5 * wave.phasors.length;
                //const normal = parseFloat(input.value);
                //const value  = law.denormalise(0, max, normal);

                data.phasors[i0] = input.outputValue;
                data.phasors[i2] = input.outputValue;

                const d = wave.phasors[i0];
                const a = wave.phasors[i0 + 1];
                const x = Math.cos(a) * d;
                const y = Math.sin(a) * d;

                data.vectors[i0]     = x;
                data.vectors[i0 + 1] = y;
                data.vectors[i2]     = x;
                data.vectors[i2 + 1] = -y;
            },

            // Respond to phase inputs
            '[name^="harmonic-"][name$="-phase"]': (input, e) => {
                const wave = this.node.wave;
                const data = Data.of(wave);
                const n    = parseInt(input.name.slice(9), 10);
                const i0   = n * 2;
                const i2   = (0.5 * wave.phasors.length - n) * 2;

                data.phasors[i0 + 1] = input.value;
                data.phasors[i2 + 1] = input.value;

                const d = wave.phasors[i0];
                const a = wave.phasors[i0 + 1];
                const x = Math.cos(a) * d;
                const y = Math.sin(a) * d;

                data.vectors[i0]     = x;
                data.vectors[i0 + 1] = y;
                data.vectors[i2]     = x;
                data.vectors[i2 + 1] = -y;
            },

            // Respond to magnitude gate input
            '[name="gate-magnitude"]': (input, e) => {
                const wave   = this.node.wave;
                const value  = input.outputValue;
                //const normal = parseFloat(input.value);
                //const value  = law.denormalise(0, 1, normal);
                //Data.of(wave).gate    = parseFloat(value);
                Data.of(wave).gate = value;
            }
        }));

        events('click', shadow).each(delegate({
            // Zero out magnitudes
            '[name^="harmonics-gain"]': (input, e) => {
                let wave = this.node.wave;
                let i    = wave.size;
                while (i--) {
                    wave.phasors[i * 2] = 0;
                    wave.vectors[i * 2]     = 0;
                    wave.vectors[i * 2 + 1] = 0;
                    // For the lowest 33 swap wave for Data.of(wave), as
                    // these are observed for changes. A little clunky perhaps.
                    if (i === 33) wave = Data.of(wave);
                }
            },

            // Zero out phases
            '[name^="harmonics-phase"]': (input, e) => {
                let wave = this.node.wave;
                let i    = wave.size;
                while (i--) {
                    const d = wave.phasors[i * 2];
                    const a = wave.phasors[i * 2 + 1] = 0;
                    const x = Math.cos(a) * d;
                    const y = Math.sin(a) * d;
                    wave.vectors[i * 2]     = x;
                    wave.vectors[i * 2 + 1] = y;
                    // For the lowest 33 swap wave for Data.of(wave), as
                    // these are observed for changes. A little clunky perhaps.
                    if (i === 33) wave = Data.of(wave);
                }
            }
        }));

        setupDataLawAttribute(shadow);
    },

    connect: function(shadow, { canvas, ctx, box, consts, renderers, ui }) {
        connect.apply(this, arguments);

        // Where node is not yet defined give element node
        if (!this.node) this.node = new RhythmSynth(0, {
            duration: 7,
            events: [
                [0,   'meter', 3,  1],
                [0,   'start', 80, 1],
                [1.5, 'start', 80, 1],
                [3,   'meter', 4,  1],
                [3,   'start', 80, 1],
                [3.5, 'start', 80, 1],
                [5,   'start', 80, 1],
                [6,   'start', 80, 1]
            ]
        });

        const a = eventsBlock.render(shadow, consts, { node: this.node });
        const b = harmonics.render(shadow, consts, { node: this.node });
        ui.append(a.content);
        ui.append(b.content);

        // Return objects that need to be .stop()ed on disconnect
        return [a, b, Signal.frame(() => {
            // Signal changes to this.node.wave
            const samples = Data.of(this.node).wave.outputSamples;


const events = Data.of(this.node.events);
let n = events.length, a;
while (n--) {
    events[n][0];
    events[n][2];
    events[n][3];
}
console.log('FRAME');


            // Draw
            draw(canvas, ctx, box, this.node, Data.objectOf(samples), this.node, this.node.wave);
        })];
    }
}, properties);
