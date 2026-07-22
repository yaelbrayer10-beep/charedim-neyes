'use strict';

require('../require-main');
require('./nodebb-global');

const crypto = require('crypto');
const nconf = require('nconf');
nconf.argv().env({ separator: '__' });

const { paths } = require('./src/constants');
const prestart = require('./src/prestart');

prestart.loadConfig(paths.config);

const install = require('./src/install');

install.values = {
	url: process.env.RENDER_EXTERNAL_URL || process.env.FORUM_URL,
	secret: process.env.NODEBB_SECRET || crypto.randomBytes(24).toString('hex'),
	submitPluginUsage: 'no',
	database: 'mongo',
	'mongo:uri': process.env.MONGO_URI,
	'admin:username': process.env.ADMIN_USERNAME,
	'admin:email': process.env.ADMIN_EMAIL,
	'admin:password': process.env.ADMIN_PASSWORD,
	'admin:password:confirm': process.env.ADMIN_PASSWORD,
};

(async () => {
	await install.setup();
	console.log('BOOTSTRAP_DONE');
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
