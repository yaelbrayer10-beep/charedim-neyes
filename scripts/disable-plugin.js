'use strict';

require('../require-main');
require('./nodebb-global');

const nconf = require('nconf');
nconf.argv().env({ separator: '__' });

const { paths } = require('./src/constants');
const prestart = require('./src/prestart');

prestart.loadConfig(paths.config);

if (process.env.MONGO_URI) {
	nconf.set('database', 'mongo');
	nconf.set('mongo:uri', process.env.MONGO_URI);
}
if (!nconf.get('url')) {
	nconf.set('url', 'http://localhost:4567');
}

const db = require('./src/database');
const plugins = require('./src/plugins');

const pluginId = process.argv[2];

(async () => {
	if (!pluginId) {
		console.error('Usage: node scripts/disable-plugin.js <plugin-id>');
		process.exit(1);
	}
	await db.init();
	const isActive = await plugins.isActive(pluginId);
	console.log(`${pluginId} isActive: ${isActive}`);
	if (isActive) {
		await plugins.toggleActive(pluginId);
		console.log(`${pluginId} deactivated.`);
	} else {
		console.log(`${pluginId} already inactive, nothing to do.`);
	}
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
