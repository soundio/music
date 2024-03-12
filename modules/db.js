
import * as config from './config.js';
import overload from '../../fn/modules/overload.js';


console.log('Worker', config.workerBasePath + 'modules/db-worker.js');
console.log('Database building...');

// Launch and handle worker

const worker  = new Worker(config.workerBasePath + 'modules/db-worker.js', { type: 'module' });
const message = {};

function send(command, data) {
    // populate message
    message.command = command;
    message.data    = data;

    // Send it
    worker.postMessage(message);
}

worker.onerror = (e) => {
    console.error(e.type, e);
};

worker.onmessage = overload((e) => e.data.command, {
    'db-populated': (e) => console.log('Database built (' + e.data.data.elapsedTime.toFixed(3) + 's)'),
    'db-error':     (e) => console.log('Database error', e.data.data),
    'default':      (e) => console.log(e.data.command)
});


setTimeout(() => {
    // Search for notes
    send('find', { min: [6, 12, 0.0000002], max: [6, 24, 1] });
}, 3000);


// Export

export default {};
