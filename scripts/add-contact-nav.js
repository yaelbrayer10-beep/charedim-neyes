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
	const current = await navAdmin.get();
	if (current.some(item => item.route === '/contact')) {
		console.log('Contact nav item already exists, nothing to do.');
		process.exit(0);
	}
	current.push({
		route: '/contact',
		title: 'צור קשר',
		enabled: true,
		iconClass: 'fa-envelope',
		textClass: 'd-lg-none',
		text: 'צור קשר',
	});
	await navAdmin.save(current);
	console.log('Contact nav item added.');
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
