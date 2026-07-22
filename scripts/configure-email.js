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
const meta = require('./src/meta');

(async () => {
	if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
		console.log('EMAIL_CONFIG_SKIPPED_NO_CREDENTIALS');
		process.exit(0);
	}

	await db.init();
	await meta.configs.setMultiple({
		'email:smtpTransport:enabled': 1,
		'email:smtpTransport:service': 'gmail',
		'email:smtpTransport:user': process.env.GMAIL_USER,
		'email:smtpTransport:pass': process.env.GMAIL_APP_PASSWORD,
		'email:from': process.env.GMAIL_USER,
	});
	console.log('EMAIL_CONFIG_DONE');
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
