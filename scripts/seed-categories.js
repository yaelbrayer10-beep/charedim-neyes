'use strict';

require('../require-main');
require('./nodebb-global');

const nconf = require('nconf');
nconf.argv().env({ separator: '__' });

const { paths } = require('./src/constants');
const prestart = require('./src/prestart');

prestart.loadConfig(paths.config);

const db = require('./src/database');
const categories = require('./src/categories');

const tree = [
	{
		name: 'ברוך הבא לפורום',
		description: 'ברוכים הבאים לפורום חרדים נייעס',
		bgColor: '#e67e22',
		icon: 'fa-handshake-o',
	},
	{
		name: 'נייעס',
		description: 'עדכונים וחדשות',
		bgColor: '#0d6efd',
		icon: 'fa-newspaper-o',
		children: [
			{ name: 'עדכונים ומבזקים', description: 'עדכונים ומבזקים שוטפים', icon: 'fa-bolt' },
			{ name: 'תגובות', description: 'תגובות הגולשים לחדשות', icon: 'fa-comments' },
		],
	},
	{
		name: 'גזרת הגיוס',
		description: 'עדכונים ודיונים בנושא גזרת הגיוס',
		bgColor: '#6f42c1',
		icon: 'fa-graduation-cap',
	},
	{
		name: 'חצרות הקודש',
		description: 'חדשות ועדכונים מחצרות הקודש',
		bgColor: '#8e44ad',
		icon: 'fa-star-and-crescent',
	},
	{
		name: 'סקרים',
		description: 'סקרים כלליים בנושאים שונים',
		bgColor: '#198754',
		icon: 'fa-bar-chart',
	},
	{
		name: 'אזור המערכת',
		description: 'הודעות ומכתבים למערכת',
		bgColor: '#20c997',
		icon: 'fa-cogs',
		children: [
			{ name: 'הודעות מערכת', description: 'הודעות רשמיות מהנהלת הפורום', icon: 'fa-bullhorn' },
			{ name: 'מכתבים למערכת', description: 'פניות למנהלי הפורום', icon: 'fa-envelope' },
			{ name: 'הצעות ייעול ובאגים', description: 'דיווחי באגים והצעות שיפור', icon: 'fa-bug' },
		],
	},
];

async function createTree(nodes, parentCid, order) {
	for (const node of nodes) {
		const cat = await categories.create({
			name: node.name,
			description: node.description,
			icon: node.icon,
			bgColor: node.bgColor,
			parentCid: parentCid || 0,
			order: order++,
		});
		console.log(`Created cid=${cat.cid} "${node.name}" parentCid=${parentCid || 0}`);
		if (node.children && node.children.length) {
			await createTree(node.children, cat.cid, 1);
		}
	}
}

(async () => {
	await db.init();
	const existingCids = await categories.getAllCidsFromSet('categories:cid');
	if (existingCids.length) {
		const existingCats = await categories.getCategoriesData(existingCids);
		const alreadySeeded = existingCats.some(c => c.name === tree[0].name);
		if (alreadySeeded) {
			console.log('Categories already seeded, skipping.');
			process.exit(0);
		}
		console.log(`Purging ${existingCids.length} default categories...`);
		for (const cid of existingCids) {
			await categories.purge(cid, 1);
		}
	}
	await createTree(tree, 0, 1);
	console.log('SEED_DONE');
	process.exit(0);
})().catch((err) => {
	console.error(err);
	process.exit(1);
});
