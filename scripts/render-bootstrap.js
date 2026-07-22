'use strict';

require('../require-main');
require('./nodebb-global');

const crypto = require('crypto');
const nconf = require('nconf');
nconf.argv().env({ separator: '__' });

const { paths } = require('./src/constants');
const prestart = require('./src/prestart');

prestart.loadConfig(paths.config);

const url = process.env.RENDER_EXTERNAL_URL || process.env.FORUM_URL;
const secret = process.env.NODEBB_SECRET || crypto.randomBytes(24).toString('hex');

// Needed for db.init() below, since config.json doesn't exist yet on a fresh
// checkout (install.values only wires into nconf inside install.setup()).
nconf.set('database', 'mongo');
nconf.set('mongo:uri', process.env.MONGO_URI);
if (!nconf.get('url')) {
	nconf.set('url', url);
}

const install = require('./src/install');
const db = require('./src/database');
const categories = require('./src/categories');

install.values = {
	url,
	secret,
	submitPluginUsage: 'no',
	database: 'mongo',
	'mongo:uri': process.env.MONGO_URI,
	'admin:username': process.env.ADMIN_USERNAME,
	'admin:email': process.env.ADMIN_EMAIL,
	'admin:password': process.env.ADMIN_PASSWORD,
	'admin:password:confirm': process.env.ADMIN_PASSWORD,
};

(async () => {
	await db.init();
	const existingCids = await categories.getAllCidsFromSet('categories:cid');
	if (existingCids.length) {
		// Already bootstrapped on a previous deploy (config.json doesn't persist
		// across Render builds). Re-running install.setup() here would re-run
		// createWelcomePost() against categories that install.setup() itself
		// just recreated, and since we replace the defaults with our own tree
		// afterwards (scripts/seed-categories.js), that call fails on repeat
		// deploys. Just rewrite config.json and skip the rest of setup.
		await install.save({
			url,
			secret,
			database: 'mongo',
			mongo: { uri: process.env.MONGO_URI },
		});
		console.log('BOOTSTRAP_SKIPPED_ALREADY_SET_UP');
		process.exit(0);
	}
	await install.setup();
	console.log('BOOTSTRAP_DONE');
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
