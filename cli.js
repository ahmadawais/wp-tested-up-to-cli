#!/usr/bin/env node

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
	handleError(`UNHANDLED ERROR`, err);
});

const meow = require('meow');
const axios = require('axios');
const ora = require('ora');
const cliA11y = require('cli-a11y');
const chalk = require('chalk');
const exitClone = require('./utils/exitClone.js');
const handleError = require('cli-handle-error');
const shouldCancel = require('cli-should-cancel');
const to = require('await-to-js').default;
const spinner = ora({ text: '' });
const semverCoerce = require('semver/functions/coerce');
const semverValid = require('semver/functions/valid');
const welcome = require('cli-welcome');
const { getValue, setValue } = require('wp-file-header-metadata');
const { Toggle, prompt } = require('enquirer');
const dim = chalk.dim;
const yellow = chalk.bold.yellow;
const green = chalk.bold.green;

const cli = meow(
	`
	Usage
	  wp-tested-up-to-cli

	Options
	  --latest, -l  Update to latest WordPress version.
	  --debug, -d   Get debug information.

	Example
	  wp-tested-up-to-cli
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
			debug: {
				type: 'boolean',
				default: false,
				alias: 'd'
			}
		}
	}
);

(async () => {
	welcome(`WP Tested Up to CLI`, `by Awais.dev`);
	const debug = cli.flags.debug;
	cliA11y({ toggle: true });

	// Root.
	const promptClone = new Toggle({
		name: `clone`,
		message: `Are you running this in the root directory of your WordPress plugin's GitHub repo clone?`
	});

	const [errClone, clone] = await to(promptClone.run());
	handleError(`FAILED ON CLONE`, errClone);
	await shouldCancel(clone);
	exitClone(clone);

	spinner.start(`${yellow(`CURRENT`)} version of "Tested up to"…`);
	const version = await getValue('Tested up to', 'readme.txt');
	const finalVersion = semverValid(semverCoerce(version));
	debug && console.log('finalVersion: ', finalVersion);
	spinner.succeed(`${green(`CURRENT`)} version of "Tested up to": ${green(finalVersion)}`);

	const [errCustom, custom] = await to(
		new Toggle({
			name: `custom`,
			message: `Define a custom "Tested up to" version or set to the latest WordPress version?`,
			enabled: `Custom Ver`,
			disabled: `WordPress Ver`
		}).run()
	);
	handleError(`FAILED ON CUSTOM`, errCustom);
	await shouldCancel(custom);

	// Custom.
	if (custom) {
		const [errVersion, customVersion] = await to(
			prompt({
				type: `input`,
				name: `customVersion`,
				initial: `5.4.0`,
				message: `Define the custom "Tested up to" version?`,
				validate(value) {
					return !value || !semverValid(value)
						? `Enter a vaild version. E.g. major.minor.patch i.e. 5.3.2`
						: true;
				}
			})
		);
		handleError(`NAME`, errVersion);
		await shouldCancel(customVersion);
		newVersion = customVersion.customVersion;

		spinner.start(`${yellow(`UPDATING`)} "Tested up to" version…`);
		setValue('Tested up to', newVersion, 'readme.txt');
		spinner.succeed(`${green(`UPDATED`)} "Tested up to" version to: ${green(newVersion)}`);
	}

	if (!custom) {
		spinner.start(`${yellow(`LATEST`)} WordPress version…`);
		const wpApiUrl = 'https://api.wordpress.org/core/version-check/1.7/';
		const wpData = await axios.get(wpApiUrl);
		const wpVersion = wpData.data.offers[0].version;
		debug && console.log('wpVersion: ', wpVersion);
		spinner.succeed(`${green(`LATEST`)} WordPress version: ${green(wpVersion)}`);

		spinner.start(`${yellow(`UPDATING`)} "Tested up to" version…`);
		setValue('Tested up to', wpVersion, 'readme.txt');
		spinner.succeed(`${green(`UPDATED`)} "Tested up to" version to: ${green(wpVersion)}`);
	}

	console.log();
})();
