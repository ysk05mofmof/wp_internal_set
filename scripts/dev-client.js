// This module only refreshes assets already enqueued by the WordPress theme.
if (import.meta.hot) {
	import.meta.hot.on('internal-theme:built', ({ css, reload }) => {
		if (reload) {
			window.location.reload();
			return;
		}
		for (const link of document.querySelectorAll(
			'link[rel="stylesheet"]',
		)) {
			const url = new URL(link.href);
			if (
				!css.some((file) =>
					decodeURI(url.pathname).endsWith(`/dist/${file}`),
				)
			)
				continue;
			const replacement = link.cloneNode();
			url.searchParams.set('ver', Date.now().toString());
			replacement.href = url.href;
			replacement.onload = () => link.remove();
			replacement.onerror = () => replacement.remove();
			link.after(replacement);
		}
	});
}
