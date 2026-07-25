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
const groups = require('./src/groups');

const username = process.argv[2];
const newPassword = process.argv[3];

(async () => {
	if (!username || !newPassword) {
		console.error('Usage: node scripts/reset-admin-password.js <username> <newPassword>');
		process.exit(1);
	}
	await db.init();

	const uid = await user.getUidByUsername(username);
	if (!uid) {
		console.error(`No user found with username: ${username}`);
		process.exit(1);
	}

	user.isPasswordValid(newPassword);
	const hash = await user.hashPassword(newPassword);

	await user.setUserFields(uid, {
		password: hash,
		'password:shaWrapped': 1,
		'email:confirmed': 1,
	});

	// Clear any lockout from failed login attempts and revoke old sessions.
	await user.auth.resetLockout(uid);
	await groups.join('verified-users', uid);
	await groups.leave('unverified-users', uid);

	console.log(`Password reset for ${username} (uid ${uid}). Lockout cleared.`);
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
