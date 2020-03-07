#!/usr/bin/env node

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
	handleError(`UNHANDLED ERROR`, err);
});

const meow = require('meow');
const cliA11y = require('cli-a11y');
const logSymbols = require('log-symbols');
const semverValid = require('semver/functions/valid');
const promptClone = require('./utils/promptClone.js');
const printCurrentVersion = require('./utils/printCurrentVersion.js');
const getCustomVersion = require('./utils/getCustomVersion.js');
const setVersion = require('./utils/setVersion.js');
const getWPVersion = require('./utils/getWPVersion.js');
const handleError = require('cli-handle-error');
const welcome = require('cli-welcome');
const chalk = require('chalk');
const green = chalk.bold.green;
const dim = chalk.dim;

const cli = meow(
	`
	Usage
	  ${green(`wp-tested-up-to-cli`)}

	Options
	  --latest, -l  Update to latest WordPress version.
	  --custom, -c  Update to a custom WordPress version.

	Example
	  ${green(`wp-tested-up-to-cli`)}
`,
	{
		booleanDefault: undefined,
		hardRejection: false,
		inferType: false,
		flags: {
			latest: {
				type: 'boolean',
				default: false,
				alias: 'l'
			},
			custom: {
				type: 'string',
				alias: 'c'
			}
		}
	}
);

(async () => {
	welcome(`WP Tested Up to CLI`, `by Awais.dev`);
	const latest = cli.flags.latest;
	const customVersion = cli.flags.custom;

	// Power mode.
	if (latest) {
		await printCurrentVersion();
		const wpVersion = await getWPVersion();
		await setVersion(wpVersion);
	}

	if (customVersion) {
		await printCurrentVersion();
		const isValid = semverValid(customVersion) ? true : false;
		if (!isValid) {
			console.log(`${logSymbols.error} Enter a vaild version. E.g. major.minor.patch i.e. 5.3.2\n`);
			process.exit(0);
		}
		await setVersion(customVersion);
	}

	// Interactive mode.
	if (!latest && !customVersion) {
		cliA11y({ toggle: true });
		await promptClone();
		await printCurrentVersion();
		const custom = await promptCustom();

		if (custom) {
			const newVersion = await getCustomVersion();
			await setVersion(newVersion);
		}

		if (!custom) {
			const wpVersion = await getWPVersion();
			await setVersion(wpVersion);
		}
	}

	console.log(
		`${logSymbols.success} ${green(`All done!`)}\n\n${logSymbols.info} ${dim(`Tip: Check out `)}${green(
			`wp-continous-deployment`
		)}\n${dim(`https://github.com/ahmadawais/wp-continuous-deployment`)}\n`
	);
})();
