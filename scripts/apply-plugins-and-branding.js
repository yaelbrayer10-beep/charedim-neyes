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
const plugins = require('./src/plugins');
const meta = require('./src/meta');

const pluginIds = [
	'@nodebb/nodebb-plugin-reactions',
	'nodebb-plugin-admin-chats',
	'nodebb-plugin-announcements',
	'nodebb-plugin-cards',
	'nodebb-plugin-chat-search',
	'nodebb-plugin-colors',
	'nodebb-plugin-custom-notify',
	'nodebb-plugin-custom-pages',
	'nodebb-plugin-edit-locked-topics',
	'nodebb-plugin-emoji-apple',
	'nodebb-plugin-emoji-extended',
	'nodebb-plugin-emoji-one',
	'nodebb-plugin-extended-markdown',
	'nodebb-plugin-impersonate-users',
	'nodebb-plugin-moving-topics',
	'nodebb-plugin-ntfy',
	'nodebb-plugin-openai',
	'nodebb-plugin-original-upload-filenames',
	'nodebb-plugin-poll',
	'nodebb-plugin-question-and-answer',
	'nodebb-plugin-reply-as-bot',
	'nodebb-plugin-silent-edit',
	'nodebb-plugin-simple-contact',
	'nodebb-plugin-soundpack-default',
	'nodebb-plugin-sso-google',
	'nodebb-theme-vanilla',
];

(async () => {
	await db.init();

	for (const pluginId of pluginIds) {
		const isActive = await plugins.isActive(pluginId);
		if (!isActive) {
			await plugins.toggleActive(pluginId);
			console.log(`${pluginId} activated.`);
		} else {
			console.log(`${pluginId} already active.`);
		}
	}

	await meta.configs.setMultiple({
		title: 'חרדים בלבד',
		browserTitle: 'חרדים בלבד',
		'title:short': 'חרדים בלבד',
	});
	console.log('Site title set to חרדים בלבד');

	console.log('APPLY_DONE');
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
