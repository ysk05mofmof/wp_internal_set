import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runtime, workspace } from './php-runtime.mjs';

const config = runtime();
const check = spawnSync(config.php, ['-r', 'echo PHP_BINARY;'], {
	env: config.env,
	encoding: 'utf8',
});
if (check.status !== 0)
	throw new Error(
		'PHP CLI unavailable. Set PHP_BINARY or .php-tools.json first.',
	);
const target = resolve(workspace, '.vscode/settings.json');
const shared = JSON.parse(
	readFileSync(resolve(workspace, '.vscode/settings.shared.json'), 'utf8'),
);
const current = existsSync(target)
	? JSON.parse(readFileSync(target, 'utf8'))
	: {};
const php = check.stdout.trim();
if (!isAbsolute(php)) throw new Error('Could not resolve PHP executable.');
writeFileSync(
	target,
	JSON.stringify(
		{
			...current,
			...shared,
			'phpsab.phpExecutablePath': php,
			'phpsab.executablePathCS': resolve(workspace, 'vendor/bin/phpcs'),
			'phpsab.executablePathCBF': resolve(workspace, 'vendor/bin/phpcbf'),
			'php.validate.executablePath': php,
		},
		null,
		'\t',
	) + '\n',
);
console.log(
	'Generated ignored .vscode/settings.json with your PHP executable.',
);
