<?php
/**
 * Local development browser connection.
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

/** Load only the local browser-reload client. */
function internal_theme_enqueue_development_client() {
	$origin = internal_theme_dev_origin();
	if ( $origin ) {
		wp_enqueue_script_module( 'internal-theme-live-reload', $origin . '/@internal-theme/reload', array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Local browser-reload client.
	}
}
add_action( 'wp_enqueue_scripts', 'internal_theme_enqueue_development_client' );
