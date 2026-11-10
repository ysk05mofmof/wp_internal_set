import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const theme = resolve(
	workspace,
	'public/wp-content/themes/internal-theme',
);

export function runtime() {
	const file = resolve(workspace, '.php-tools.json');
	const config = existsSync(file)
		? JSON.parse(readFileSync(file, 'utf8'))
		: {};
	// Read only known paths from Local's envrc; never execute its contents.
	const envrc = resolve(workspace, '.envrc');
	const local = existsSync(envrc) ? readFileSync(envrc, 'utf8') : '';
	const phpDir = local.match(
		/export PATH="([^"\r\n]*\/php-[^"\r\n]*\/bin\/win64):\$PATH"/,
	)?.[1];
	const composerDir = local.match(
		/export PATH="([^"\r\n]*\/composer\/win32):\$PATH"/,
	)?.[1];
	const phprc = local.match(/export PHPRC="([^"\r\n]+)"/)?.[1];
	let cliIni;
	if (phprc && existsSync(resolve(phprc, 'php.ini'))) {
		cliIni = resolve(workspace, '.php-cli.ini');
		const ini = readFileSync(resolve(phprc, 'php.ini'), 'utf8')
			.replace(
				/^\s*extension\s*=\s*php_imagick\.dll\s*$/gm,
				'; ImageMagick is not required by CLI tooling.',
			)
			.replace(
				/^sys_temp_dir=.*$/gm,
				`sys_temp_dir="${tmpdir().replaceAll('\\', '/')}"`,
			);
		writeFileSync(cliIni, ini);
	}
	return {
		php:
			process.env.PHP_BINARY ||
			config.php ||
			(phpDir ? resolve(phpDir, 'php.exe') : 'php'),
		composer:
			process.env.COMPOSER_PHAR ||
			config.composer ||
			(composerDir ? resolve(composerDir, '../composer.phar') : null),
		env: {
			...process.env,
			...(cliIni ? { PHPRC: cliIni } : {}),
			...(config.phprc ? { PHPRC: config.phprc } : {}),
		},
	};
}
