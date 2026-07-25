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
	nconf.set('url', process.env.RENDER_EXTERNAL_URL || process.env.FORUM_URL);
}

const db = require('./src/database');
const navAdmin = require('./src/navigation/admin');

(async () => {
	await db.init();
	const items = await navAdmin.get();
	const filtered = items.filter(item => item.route !== '/world');
	if (filtered.length === items.length) {
		console.log('No /world nav item found, nothing to remove.');
		process.exit(0);
	}
	await navAdmin.save(filtered);
	console.log(`Removed /world nav item (${items.length} -> ${filtered.length} items).`);
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
