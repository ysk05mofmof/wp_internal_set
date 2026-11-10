<?php
/**
 * Main template.
 *
 * @package InternalTheme
 */

get_header();
?>
<main class="site-main">
	<?php if ( is_front_page() ) : ?>
		<p>わはは！</p>
	<?php endif; ?>
	<?php if ( have_posts() ) : ?>
		<?php while ( have_posts() ) : ?>
			<?php the_post(); ?>
			<article <?php post_class(); ?>>
				<h1><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1>
				<?php the_content(); ?>
			</article>
		<?php endwhile; ?>
		<?php the_posts_pagination(); ?>
	<?php else : ?>
		<p><?php esc_html_e( 'No posts found.', 'internal-theme' ); ?></p>
	<?php endif; ?>
</main>
<?php
get_footer();
