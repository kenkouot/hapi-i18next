'use strict';
var gulp = require('gulp'),
    tsc = require('gulp-typescript');

gulp.task('source:compile', function () {
    return gulp.src('./src/hapi-i18next.ts')
        .pipe(tsc({module: 'commonjs'})).js
        .pipe(gulp.dest('./dist'));
});
