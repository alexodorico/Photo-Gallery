var gulp = require('gulp');
var sass = require('gulp-sass');
var bs = require('browser-sync').create();

gulp.task('browser-sync', ['sass'], function() {
	bs.init({
        server: {
            baseDir: './public/'
        }
	});
});

gulp.task('sass', function() {
	gulp.src('public/*.scss')
		.pipe(sass())
		.pipe(gulp.dest('public/'))
		.pipe(bs.reload({stream: true}));
});

gulp.task('default', ['browser-sync'], function() {
	gulp.watch('public/*.scss', ['sass']);
	gulp.watch('public/*.js').on('change', bs.reload);
	gulp.watch('public/*.html').on('change', bs.reload);
});

