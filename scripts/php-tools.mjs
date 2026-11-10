import { spawnSync } from 'node:child_process';
import { runtime, workspace } from './php-runtime.mjs';
import { resolve } from 'node:path';

const [tool, ...args] = process.argv.slice(2);
if (!['composer', 'phpcs', 'phpcbf'].includes(tool)) {
	throw new Error('Supported tools: composer, phpcs, phpcbf');
}
const config = runtime();
const command =
	tool === 'composer' && !config.composer ? 'composer' : config.php;
const parameters =
	tool === 'composer'
		? [...(config.composer ? [config.composer] : []), ...args]
		: [resolve(workspace, 'vendor/bin', tool), ...args];
const result = spawnSync(command, parameters, {
	cwd: workspace,
	env: config.env,
	stdio: 'inherit',
});
if (result.error) console.error(result.error.message);
// PHPCBF exit 1 means all fixable issues were successfully fixed.
process.exitCode =
	tool === 'phpcbf' && result.status === 1 ? 0 : (result.status ?? 1);
