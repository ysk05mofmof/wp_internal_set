<?php
/**
 * Vite asset integration.
 *
 * @package InternalTheme
 */

/**
 * Find a running local Vite server, never used outside local environments.
 *
 * @return string Development origin or an empty string.
 */
function internal_theme_dev_origin() {
	if ( 'local' !== wp_get_environment_type() ) {
		return '';
	}
	$marker = get_template_directory() . '/.vite-dev.json';
	if ( ! is_readable( $marker ) ) {
		return '';
	}
	$data   = json_decode( file_get_contents( $marker ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local marker, not a remote request.
	$origin = $data['origin'] ?? '';
	$host   = wp_parse_url( $origin, PHP_URL_HOST );
	if ( ! in_array( $host, array( 'localhost', '127.0.0.1', '::1' ), true ) ) {
		return '';
	}
	// This probe is restricted to loopback in a local environment. WordPress's CA bundle does not contain local development certificates.
	$response = wp_remote_get(
		$origin . '/@vite/client',
		array(
			'timeout'     => 1,
			'redirection' => 0,
			'sslverify'   => false,
		)
	);
	return ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ? $origin : '';
}

/** Enqueue the default theme assets. */
function internal_theme_enqueue_assets() {
	$entries = apply_filters( 'internal_theme_asset_entries', array( 'src/scss/common.scss', 'src/js/common.js' ) );
	$origin  = internal_theme_dev_origin();
	if ( $origin ) {
		wp_enqueue_script_module( 'internal-theme-vite', $origin . '/@vite/client', array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Vite manages development caching.
	}
	foreach ( $entries as $source ) {
		internal_theme_enqueue_asset( $source, $origin );
	}
}
add_action( 'wp_enqueue_scripts', 'internal_theme_enqueue_assets' );

/**
 * Enqueue one source entry using Vite or the production manifest.
 *
 * @param string $source Theme-relative source path.
 * @param string $origin Development server origin, or an empty string.
 */
function internal_theme_enqueue_asset( $source, $origin = '' ) {
	$handle = 'internal-theme-' . md5( $source );
	if ( $origin ) {
		wp_enqueue_script_module( $handle, $origin . '/' . $source, array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Vite manages development caching.
		return;
	}
	static $manifest = null;
	if ( null === $manifest ) {
		$path     = get_template_directory() . '/dist/.vite/manifest.json';
		$manifest = is_readable( $path ) ? json_decode( file_get_contents( $path ), true ) : array(); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local build manifest.
	}
	if ( empty( $manifest[ $source ]['file'] ) ) {
		return;
	}
	$file    = $manifest[ $source ]['file'];
	$base    = get_template_directory_uri() . '/dist/';
	$version = (string) filemtime( get_template_directory() . '/dist/' . $file );
	if ( str_ends_with( $file, '.css' ) ) {
		wp_enqueue_style( $handle, $base . $file, array(), $version );
		return;
	}
	$visited = array();
	internal_theme_enqueue_manifest_css( $manifest, $source, $base, $visited );
	wp_enqueue_script_module( $handle, $base . $file, array(), $version );
}

/**
 * Enqueue entry and shared chunk styles once.
 *
 * @param array  $manifest Build manifest.
 * @param string $key      Entry key.
 * @param string $base     Asset URL prefix.
 * @param array  $visited  Already processed entries.
 */
function internal_theme_enqueue_manifest_css( $manifest, $key, $base, &$visited ) {
	if ( isset( $visited[ $key ] ) || ! isset( $manifest[ $key ] ) ) {
		return;
	}
	$visited[ $key ] = true;
	$entry           = $manifest[ $key ];
	foreach ( $entry['imports'] ?? array() as $import ) {
		internal_theme_enqueue_manifest_css( $manifest, $import, $base, $visited );
	}
	foreach ( $entry['css'] ?? array() as $css ) {
		wp_enqueue_style( 'internal-theme-' . md5( $css ), $base . $css, array(), (string) filemtime( get_template_directory() . '/dist/' . $css ) );
	}
}
