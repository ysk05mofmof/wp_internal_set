import { build, createServer } from 'vite';
import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { theme, workspace } from './php-runtime.mjs';

import { fileURLToPath } from 'node:url';

export async function startDevelopment() {
	const configFile = resolve(workspace, 'vite.config.js');
	let previous = new Map();
	let server;
	let pending = false;
	let running;
	let timer;

	async function rebuild() {
		if (running) {
			pending = true;
			return running;
		}
		running = (async () => {
			do {
				pending = false;
				try {
					const result = await build({ configFile });
					const current = new Map(
						result.output.map((item) => [
							item.fileName,
							item.type === 'chunk'
								? item.code
								: String(item.source),
						]),
					);
					const changed = [...current.keys()].filter(
						(file) => current.get(file) !== previous.get(file),
					);
					const removed = [...previous.keys()].some(
						(file) => !current.has(file),
					);
					server?.ws.send({
						type: 'custom',
						event: 'internal-theme:built',
						data: {
							css: changed.filter((file) =>
								file.endsWith('.css'),
							),
							reload:
								removed ||
								changed.some((file) => !file.endsWith('.css')),
						},
					});
					previous = current;
				} catch (error) {
					console.error(error);
					if (!server) throw error;
				}
			} while (pending);
		})();
		try {
			await running;
		} finally {
			running = undefined;
		}
	}

	await rebuild();
	server = await createServer({ configFile });
	await server.listen();
	server.printUrls();
	const watcher = watch(resolve(theme, 'src'), { recursive: true }, () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			void rebuild();
		}, 150);
	});

	async function close() {
		watcher.close();
		clearTimeout(timer);
		await running;
		await server.close();
	}

	return { server, close };
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const { close } = await startDevelopment();
	for (const signal of ['SIGINT', 'SIGTERM']) {
		process.once(signal, () => {
			void close().then(() => process.exit(0));
		});
	}
}
