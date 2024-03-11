
import * as config from './config.js';
import overload from '../../fn/modules/overload.js';


console.log('Worker', config.workerBasePath + 'modules/db-worker.js');

// Launch and handle worker

const worker  = new Worker(config.workerBasePath + 'modules/db-worker.js', { type: 'module' });
const message = {};

function sendMessage(command, data) {
    // populate message
    message.command = command;
    message.data    = data;

    // Send it
    worker.postMessage(message);
}

worker.onmessage = overload((e) => e.data.command, {
    'db-populated': (e) => console.log('Database ready', e.data.data.elapsedTime + 's'),
    'default':      (e) => console.log(e.data.command)
});


// Export

export default {};
