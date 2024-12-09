import create   from 'dom/create.js';
import delegate from 'dom/delegate.js';
import element  from 'dom/element.js';
import events   from 'dom/events.js';
import Data     from 'fn/data.js';
import Signal   from 'fn/signal.js';
import Event    from 'soundstage/event.js';
import RhythmSynth from './module.js';
import presets  from './presets.js';
import { shadow, construct, connect, properties } from '../stage-node/module.js';
import { plotYAxis, plot, plotWaveform, plotBuffer, plotSignpost, plotSamples, plotMeter } from '../../modules/canvas.js';


import Renderer       from 'literal/modules/template.js';
import { printError } from 'literal/modules/print.js';


// data-law attribute for input[type="range"]
import 'bolt/attributes/data-law.js';


const assign = Object.assign;


function draw(canvas, ctx, box, node, samples, data, waveform) {
    const { width, height } = canvas;
    // Get constants from DATA
    const { vectors, phasors } = waveform;
    const sequence = { data };

    // Get data from the 0th and the first 32 harmonics
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

function vectorsToSamples(vectors, samples = new vectors.constructor(vectors.length / 2)) {
    // Reject vectors below gate threshold
    const gatedVectors = new vectors.constructor(vectors.length);

    let j = gatedVectors.length / 4, j1, j2, max, mag, gain;
    while (j--) {
        j1 = j * 2;
        j2 = (0.5 * DATA.phasors.length - j) * 2;
        max  = j ? 0.25 * DATA.phasors.length / j : 0.5 * DATA.phasors.length ;
        mag  = DATA.phasors[2 * j];
        gain = mag / max;
        if (gain > data.gate) {
            gatedVectors[j1]     = vectors[j1];
            gatedVectors[j1 + 1] = vectors[j1 + 1];
            gatedVectors[j2]     = vectors[j2];
            gatedVectors[j2 + 1] = vectors[j2 + 1];
        }
    }

    // Do the inverse FFT to print the output signal. THIS SHOULD BE
    // IN A SEPARATE RENDER FN SOMEWHERE. It's only here because
    // this is where updates happen, for now.
    const output = DATA.output = ifft(gatedVectors);
    let i = output.length, x, y;
    while (i) {
        y = output[--i];
        x = output[--i];
        // All imaginary parts should be 0, or very near 0
        if (y < -0.000000001 && y > 0.000000001) console.log('PHASE NOT 0!!! What gives?');
        // Real parts are the samples, write them back to the samples buffer
        samples[i / 2] = x;
    }

    return samples;
}



/** <stage-rhythm-synth> **/

export default element('<stage-rhythm-synth>', {
    mode: 'open',

    templates: {
        harmonic: `
            <label class="y2 center-align text-10 darklime-fg" for="harmonic-$\{ DATA.n }-magnitude" style="grid-column: $\{ DATA.n + 1 }; margin-top: 0; padding: 0; min-height: 0; $\{ DATA.sequence.duration === DATA.n ? 'font-weight: bold;' : '' } color: $\{ data.phasors[2 * DATA.n] / DATA.max <= data.data.gate ? 'black' : 'var(--darklime)' };">$\{ DATA.n }</label>
            <input class="y1 post-input" type="range" name="harmonic-$\{ DATA.n }-magnitude" min="0" max="1" data-law="log-24db" step="any" value="$\{ law.normalise(0, DATA.max, data.phasors[2 * DATA.n]) }" title="$\{ (data.phasors[2 * DATA.n] / DATA.max) < dB96 ? 0 : (data.phasors[2 * DATA.n] / DATA.max).toPrecision(3) }" id="harmonic-$\{ DATA.n }-magnitude" style="grid-column: $\{ DATA.n + 1 }; margin: 0 auto; --normal-value: $\{ law.normalise(0, DATA.max, data.phasors[2 * DATA.n]) }; color: $\{ data.phasors[2 * DATA.n] / DATA.max <= data.data.gate ? 'black' : 'var(--lime)' };" />
            <input class="y3" style="margin: 0 auto; height: 100px; min-height: 100px; grid-column: $\{ DATA.n + 1 };" type="range" name="harmonic-$\{ DATA.n }-phase" min="-3.141592653589793" max="3.141592653589793" step="any" value="$\{ data.phasors[2 * DATA.n + 1] }" hidden="$\{ data.phasors[2 * DATA.n] === 0 }" />
        `,

        'event-input': `
            <input class="y1 square-post-input post-input yellow-fg" type="range" name="event-$\{ data.i }-gain" min="0" max="1.2" step="any" title="$\{ law.normalise(0, 1, data.event[3]) }" value="$\{ law.normalise(0, 1, data.event[3]) }" id="event-$\{ data.i }-gain" style="left: calc(100% * $\{ data.event[0] }); --normal-value: $\{ law.normalise(0, 1, data.event[3]) * 5 / 6 };" />
        `
    },

    shadow: shadow + `
        <link rel="stylesheet" href="${ window.rhythmSynthStylesheet || import.meta.url.replace(/js$/, 'css') }"/>
        <h4>Rhythm Synth</h4>

        <canvas width="1024" height="512" class="block"></canvas>



        <!--pre>$\{ DATA.samples.length } samples</pre-->

        <!--div class="events-block block" style="padding: 0; position:relative;">
            $\{ data.sequence.events.map((event, i) => include('#event-input', { i, event })) }
        </div>

        <div class="grid" style="--x-gap: 0.1875rem; --y-gap: 0.1875rem; grid-template-rows: 20vw min-content 30px; padding: 0.25rem 0.25rem;">
            $\{ Array.from({ length: 33 }, (v, n) => assign({
                n, data,
                max: n ? 0.25 * data.phasors.length / n : 0.5 * data.phasors.length
            }, DATA)).map(include('#harmonic')) }

            <label class="y2 center-align text-10" for="gate-magnitude" style="grid-column: 34; margin-top: 0; padding: 0; min-height: 0; color: black;">Gate</label>
            <input class="y1 post-input" type="range" name="gate-magnitude" min="0" max="1" step="any" value="$\{ law.normalise(0, 1, data.gate) }" style="grid-column: 34; margin: 0 auto; height: 100%; min-height: 100%; --normal-value: $\{ law.normalise(0, 1, data.gate) }; color: black;" id="gate-magnitude" />

            <label class="x34 y1 center-align" style="margin-top: 0; padding: 0; min-height: 0; font-family: sans-serif;">All</label>
            <button class="x34 y2 button" type="button" name="harmonics-gain" value="0">Zero</button>
            <button class="x34 y3 button" type="button" name="harmonics-phase" value="0">Zero</button>
        </div-->
    `,

    construct: function(shadow, internals) {
        construct.apply(this, arguments);

        const menu = shadow.querySelector('file-menu');
        presets.forEach((preset) => menu.createPreset(preset.name, preset));

        const canvas = shadow.querySelector('canvas');
        const ctx    = canvas.getContext('2d');

        internals.canvas = canvas;
        internals.ctx    = ctx;
        internals.pushed = false;
        internals.data   = Signal.of();


        events('input', shadow).each(delegate({
            // Placeholder functions for responding to magnitude and phase inputs
            '[name^="harmonic-"][name$="-magnitude"]': (input, e) => {
                const n  = parseInt(input.name.slice(9), 10);
                const i0 = n * 2;
                const i2 = (0.5 * DATA.phasors.length - n) * 2;
                const max = n ? 0.25 * DATA.phasors.length / n : 0.5 * DATA.phasors.length;
                const normal = parseFloat(input.value);
                const value = law.denormalise(0, max, normal);

                data.phasors[i0] = parseFloat(value);
                data.phasors[i2] = parseFloat(value);

                const d = data.phasors[i0];
                const a = data.phasors[i0 + 1];
                const x = Math.cos(a) * d;
                const y = Math.sin(a) * d;

                DATA.vectors[i0]     = x;
                DATA.vectors[i0 + 1] = y;
                DATA.vectors[i2]     = x;
                DATA.vectors[i2 + 1] = -y;
            },

            '[name^="harmonic-"][name$="-phase"]': (input, e) => {
                const n = parseInt(input.name.slice(9), 10);
                const i0 = n * 2;
                const i2 = (0.5 * DATA.phasors.length - n) * 2;

                data.phasors[i0 + 1] = parseFloat(input.value);
                // This has GOT to be wrong. This angle should be a reflection of angle over the x axis ???
                data.phasors[i2 + 1] = parseFloat(input.value);

                const d = data.phasors[i0];
                const a = data.phasors[i0 + 1];
                const x = Math.cos(a) * d;
                const y = Math.sin(a) * d;

                DATA.vectors[i0]     = x;
                DATA.vectors[i0 + 1] = y;
                DATA.vectors[i2]     = x;
                DATA.vectors[i2 + 1] = -y;
            },

            '[name="gate-magnitude"]': (input, e) => {
                const normal = parseFloat(input.value);
                const value  = law.denormalise(0, 1, normal);
                data.gate    = parseFloat(value);
            },

            '[name^="event-"][name$="-gain"]': (input, e) => {
                const i      = parseInt(input.name.slice(6), 10);
                const normal = parseFloat(input.value);
                const value  = law.denormalise(0, 1, normal);
                data.sequence.events[i][3] = value;
            }
        }));

        events('click', shadow).each(delegate({
            '[name^="harmonics-gain"]': (input, e) => {
                let i = data.phasors.length / 2;
                while (i--) {
                    data.phasors[i * 2] = 0;
                    DATA.vectors[i * 2]     = 0;
                    DATA.vectors[i * 2 + 1] = 0;
                }
            },

            '[name^="harmonics-phase"]': (input, e) => {
                let i = data.phasors.length / 2;
                while (i--) {
                    const d = data.phasors[i * 2];
                    const a = data.phasors[i * 2 + 1] = 0;
                    const x = Math.cos(a) * d;
                    const y = Math.sin(a) * d;

                    DATA.vectors[i * 2]     = x;
                    DATA.vectors[i * 2 + 1] = y;
                }
            }
        }));


/*
        let observer;
        Signal.observe(internals.$node, (node) => {
            if (observer) observer.stop();
            if (!node) return;
            observer = node.inputs[0].each((event) => {
                pre.innerHTML =
                    (pre.innerHTML + `\n ${ event[0].toFixed(3) } ${ postpad(' ', 8, event[1]) } ${ event[2] } ${ event[3] || '' } ${ event[4] || '' }`)
                    .slice(-96);
                pre.scrollTop = pre.scrollHeight;
            });
        });
*/

/* TEMP PLAYBACK
            const duration = 1.2;

            function cue() {
                const t0 = duration * Math.ceil(drum.context.currentTime / duration);

                sequence.events.forEach((event) => { event[1] === 'start' && drum
                    .start(t0 + event[0] * duration, event[2], event[3])
                    .stop(t0 + event[0] * duration + 0.1)
                });

                setTimeout(cue, (t0 + 0.75 * duration - drum.context.currentTime) * 1000);
            }

            cue();
*/



        // If already initialised do nothing
        if (internals.renderer) { return; }
        //internals.renderer = new Renderer(shadow, this);

        // Observe signal listens to signal value changes and calls fn()
        // immediately if signal already value, then on next tick after signal
        // mutates
        Signal.frame((data) => {
/*            const { renderer } = internals;

            if (!data) return;
            const fragment = renderer.push(data);

            // Replace DOM content on first push
            if (internals.pushed) return;
            internals.pushed = true;
            // EXPERIMENTAL! This is problematic, as replacing
            // this.parentElement means `element` inside the template will
            // no longer refer to its real parent
            const parent = this.parentElement;
            // Remove this template
            this.remove();
            // Extract the parent's contents to a fragment
            const range = new Range();
            range.selectNodeContents(parent);
            const dom = range.extractContents();
            // The parent can only be given a shadow if it is re-parsed
            // with a declarative shadow root. We may as well use this
            // template to parse HTML, it's here, and now not doing anything.
            this.setHTMLUnsafe(parent.outerHTML.replace('></', '><template shadowrootmode="open"></template></'));
            const element = this.content.children[0];
            const shadow  = element.shadowRoot;
            // Give the recreated element the original's children
            element.append(dom);
            // Give the recreated element's shadow the renderer content
            shadow.append(fragment);
            // Replace parent in the DOM with it's freshly shadowed copy
            parent.replaceWith(element);
*/
        });
    },

    connect: function(shadow, { canvas, ctx }) {
        connect.apply(this, arguments);

        // Where node is not yet defined give element node
        if (!this.node) this.node = new RhythmSynth(0, {
            gate: 0,
            sequence: {
                duration: 1,
                events: [
                    [0,      'start', 80, 1],
                    [0.1875, 'start', 80, 1],
                    [0.375,  'start', 80, 1],
                    [0.4375, 'start', 80, 1],
                    [0.625,  'start', 80, 1],
                    [0.75,   'start', 80, 1],
                    [0.9375, 'start', 80, 1]
                ]
            }
        });

        const node = Data.of(this.node);
        const box = [0, 0.5 * canvas.height, canvas.width, -0.4 * canvas.height];

        return [Signal.frame(() => {
            const samples = this.node.waveform.samples;
            draw(canvas, ctx, box, node, samples, this.node, this.node.waveform);
        })];
    }
}, properties);
