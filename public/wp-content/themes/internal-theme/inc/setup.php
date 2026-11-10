<?php
/**
 * Theme setup.
 *
 * @package InternalTheme
 */

/** Register theme features. */
function internal_theme_setup() {
	load_theme_textdomain( 'internal-theme', get_template_directory() . '/languages' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
}
add_action( 'after_setup_theme', 'internal_theme_setup' );
