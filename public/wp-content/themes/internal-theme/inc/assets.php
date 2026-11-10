<?php
/**
 * Theme styles and scripts. Edit the enqueue calls here to control each page.
 *
 * @package InternalTheme
 */

/** Enqueue shared assets explicitly from the theme's dist directory. */
function internal_theme_enqueue_assets() {
	$directory = get_template_directory();
	$uri       = get_template_directory_uri();

	wp_enqueue_style(
		'internal-theme-common',
		$uri . '/dist/css/common.min.css',
		array(),
		(string) filemtime( $directory . '/dist/css/common.min.css' )
	);
	wp_enqueue_script_module(
		'internal-theme-common',
		$uri . '/dist/js/common.min.js',
		array(),
		(string) filemtime( $directory . '/dist/js/common.min.js' )
	);
}
add_action( 'wp_enqueue_scripts', 'internal_theme_enqueue_assets' );
