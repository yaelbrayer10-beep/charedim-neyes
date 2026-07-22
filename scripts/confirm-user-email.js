'use strict';

require('../require-main');
require('./nodebb-global');

const nconf = require('nconf');
nconf.argv().env({ separator: '__' });

const { paths } = require('./src/constants');
const prestart = require('./src/prestart');
prestart.loadConfig(paths.config);

nconf.set('database', 'mongo');
nconf.set('mongo:uri', process.env.MONGO_URI);
if (!nconf.get('url')) {
	nconf.set('url', 'http://localhost:4567');
}

const db = require('./src/database');
const user = require('./src/user');

const username = process.argv[2];

(async () => {
	if (!username) {
		console.error('Usage: node scripts/confirm-user-email.js <username>');
		process.exit(1);
	}
	await db.init();
	const uid = await user.getUidByUsername(username);
	if (!uid) {
		console.error(`No user found with username: ${username}`);
		process.exit(1);
	}
	await user.email.confirmByUid(uid);
	console.log(`${username} (uid ${uid}) email confirmed.`);
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
