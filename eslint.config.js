import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: [
			'node_modules/**',
			'vendor/**',
			'public/*',
			'!public/wp-content/',
			'public/wp-content/*',
			'!public/wp-content/themes/',
			'public/wp-content/themes/*',
			'!public/wp-content/themes/internal-theme/',
			'public/wp-content/themes/internal-theme/dist/**',
		],
	},
	js.configs.recommended,
	{
		files: ['**/*.js', '**/*.mjs'],
		languageOptions: { globals: globals.node },
	},
	{
		files: ['public/wp-content/themes/internal-theme/src/js/**/*.js'],
		languageOptions: { globals: globals.browser },
	},
];
