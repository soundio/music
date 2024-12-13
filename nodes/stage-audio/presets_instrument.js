export default [{
    name: 'Thump',

    data: {
        voice: {
            nodes: {
                osc:    { type: 'tone', data: { type: 'sine', detune: 0 } },
                mix:    { type: 'mix',  data: { gain: 0.9, pan: 0 }},
                output: { type: 'gain', data: { gain: 1 }}
            },

            connects: [
                'osc', 'mix',
                'mix', 'output'
            ],

            commands: [{
                target: 'osc'
            }]
        }
    }
}];
