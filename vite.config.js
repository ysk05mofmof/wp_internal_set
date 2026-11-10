import { defineConfig, loadEnv } from 'vite';
import { readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = fileURLToPath(new URL('.', import.meta.url));
const theme = resolve(workspace, 'public/wp-content/themes/internal-theme');

function sourceEntries(directory, extension, prefix) {
	return Object.fromEntries(
		readdirSync(resolve(theme, directory), {
			recursive: true,
			withFileTypes: true,
		})
			.filter(
				(entry) =>
					entry.isFile() &&
					entry.name.endsWith(extension) &&
					(extension !== '.scss' || !entry.name.startsWith('_')),
			)
			.map((entry) => {
				const file = resolve(entry.parentPath, entry.name);
				const name = relative(resolve(theme, directory), file)
					.replaceAll('\\', '/')
					.slice(0, -extension.length);
				return [`${prefix}/${name}`, file];
			}),
	);
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, workspace, '');
	const host = env.VITE_HOST || 'localhost';
	const port = Number(env.VITE_PORT || 5173);
	const https =
		env.VITE_HTTPS_CERT && env.VITE_HTTPS_KEY
			? {
					cert: readFileSync(env.VITE_HTTPS_CERT),
					key: readFileSync(env.VITE_HTTPS_KEY),
				}
			: undefined;
	const origin = `${https ? 'https' : 'http'}://${host}:${port}`;
	const marker = resolve(theme, '.vite-dev.json');
	const styles = sourceEntries('src/scss', '.scss', 'css');

	return {
		root: theme,
		envDir: workspace,
		base: mode === 'production' ? './' : '/',
		publicDir: false,
		server: {
			host,
			port,
			strictPort: true,
			origin,
			https,
			cors: { origin: env.WP_ORIGIN || 'http://internal-test-wp.local' },
		},
		plugins: [
			{
				name: 'wordpress-css-paths',
				enforce: 'post',
				generateBundle: {
					order: 'post',
					handler(_options, bundle) {
						// Preserve separate CSS entry paths even for identical or empty styles.
						for (const [name, file] of Object.entries(styles)) {
							const expected = name + '.min.css';
							if (bundle[expected]) continue;
							const source = relative(theme, file).replaceAll(
								'\\',
								'/',
							);
							const original = Object.values(bundle).find(
								(item) =>
									item.type === 'asset' &&
									item.fileName.endsWith('.css') &&
									(item.originalFileNames?.some(
										(original) =>
											original.replaceAll('\\', '/') ===
												source ||
											resolve(theme, original) === file,
									) ||
										item.names?.includes(name + '.css')),
							);
							this.emitFile({
								type: 'asset',
								fileName: expected,
								source: original?.source ?? '',
							});
						}
					},
				},
			},
			{
				name: 'wordpress-development',
				resolveId(id) {
					if (id === '/@internal-theme/reload')
						return '\0internal-theme-reload';
				},
				load(id) {
					if (id === '\0internal-theme-reload')
						return readFileSync(
							resolve(workspace, 'scripts/dev-client.js'),
							'utf8',
						);
				},
				configureServer(server) {
					server.httpServer.once('listening', () => {
						writeFileSync(marker, JSON.stringify({ origin }));
					});
					server.httpServer.once('close', () =>
						rmSync(marker, { force: true }),
					);
					server.watcher.add(theme);
					server.watcher.on('change', (file) => {
						if (
							file.endsWith('.php') &&
							!relative(theme, file).startsWith('..') &&
							!isAbsolute(relative(theme, file)) &&
							!file.replaceAll('\\', '/').includes('/vendor/')
						) {
							server.ws.send({ type: 'full-reload', path: '*' });
						}
					});
				},
			},
		],
		build: {
			manifest: false,
			outDir: resolve(theme, 'dist'),
			rolldownOptions: {
				input: {
					...sourceEntries('src/js', '.js', 'js'),
					...styles,
				},
				output: {
					entryFileNames: '[name].min.js',
					chunkFileNames: 'js/_chunks/[name]-[hash].js',
					assetFileNames(asset) {
						const name = asset.names[0];
						return name?.endsWith('.css')
							? `${name.slice(0, -4)}.min.css`
							: 'assets/[name]-[hash][extname]';
					},
				},
			},
		},
	};
});
