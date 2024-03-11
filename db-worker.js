console.log('ARSE');

import { openDB, deleteDB, wrap, unwrap } from '../idb/idb.js';

const db = await openDB('music', 1, {
    upgrade(db, oldVersion, newVersion, transaction, e) {
        console.log('UPGRADE', db, oldVersion, newVersion, transaction);

        const modes = db.createObjectStore('modes', {
            keyPath: 'id',
            autoIncrement: false
        });

        const relations = db.createObjectStore('relations', {
            autoIncrement: true
        });
    },

    blocked(currentVersion, blockedVersion, e) {
        console.log('BLOCKED', currentVersion, blockedVersion);
    },

    blocking(currentVersion, blockedVersion, e) {
        console.log('BLOCKING', currentVersion, blockedVersion);
    },

    terminated() {
        console.log('TERMINATED');
    },
});
