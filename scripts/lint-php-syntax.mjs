import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runtime, theme } from './php-runtime.mjs';

const config = runtime();
const files = readdirSync(theme, { recursive: true, withFileTypes: true })
	.filter((entry) => entry.isFile() && entry.name.endsWith('.php'))
	.map((entry) => resolve(entry.parentPath, entry.name));
let failed = false;
for (const file of files) {
	// Syntax checks need no extensions or site-specific php.ini.
	const result = spawnSync(config.php, ['-n', '-l', file], {
		env: config.env,
		encoding: 'utf8',
	});
	if (result.status !== 0) {
		failed = true;
		console.error(result.error?.message || result.stderr || result.stdout);
	}
}
console.log(
	`PHP syntax: ${files.length} files checked${failed ? ' (failed)' : ''}.`,
);
process.exitCode = failed ? 1 : 0;
