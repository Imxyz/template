// Load plugins
var gulp = require('gulp'), // 必须先引入gulp插件
    autoprefixer = require('gulp-autoprefixer'), // 添加 CSS 浏览器前缀
    cache = require('gulp-cache'), // 缓存当前任务中的文件，只让已修改的文件通过管道
    cached = require('gulp-cached'), // 缓存当前任务中的文件，只让已修改的文件通过管道
    // clean = require('gulp-clean'), // 文件删除
    // concat = require('gulp-concat'), // 合并文件
    filter = require('gulp-filter'), // 过滤筛选指定文件
    imagemin = require('gulp-imagemin'), // 图片优化
    // jshint = require('gulp-jshint'), // js 语法校验
    minifycss = require('gulp-minify-css'), // CSS 压缩
    notify = require('gulp-notify'), // 相当于 console.log()
    rename = require('gulp-rename'), // 重命名
    rev = require('gulp-rev-append'), // 插入文件指纹（MD5）
    sass = require('gulp-ruby-sass'), // sass 编译
    uglify = require('gulp-uglify'), // js 压缩
    del = require('del'), // 文件删除
    browserSync = require('browser-sync'); // 保存自动刷新

// css
gulp.task('styles', function() {  
  return sass('src/css/**/*.scss', {style: 'expanded'})  // 传入 sass 目录及子目录下的所有 .scss 文件生成文件流通过管道并设置输出格式
    .pipe(cached('styles'))  // 缓存传入文件，只让已修改的文件通过管道（第一次执行是全部通过，因为还没有记录缓存）
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4')) // 添加 CSS 浏览器前缀，兼容最新的2个版本
    // .pipe(gulp.dest('dist/css')) // 输出到 dist/css 目录下（不影响此时管道里的文件流）
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('dist/css'))
    .pipe(notify({ message: 'Styles task complete' }));
});

// styleReload （结合 watch 任务，无刷新CSS注入）
gulp.task('styleReload', ['styles'], function() {
  return gulp.src(['dist/css/**/*.css'])
    .pipe(cached('style'))
    .pipe(browserSync.reload({stream: true})); // 使用无刷新 browserSync 注入 CSS
});

// js
gulp.task('scripts', function() {  
  return gulp.src('src/js/**/*.js')
    .pipe(cached('script'))
    // .pipe(jshint('.jshintrc'))
    // .pipe(jshint.reporter('default'))
    // .pipe(concat('main.js'))
    // .pipe(gulp.dest('dist/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// image
gulp.task('images', function() {  
  return gulp.src('src/static/images/**/*')
    // .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist/static/images'))
    .pipe(notify({ message: 'Images task complete' }));
});

// html 编译 html 文件并复制字体
gulp.task('html', function () {
  gulp.src('src/lib/**/*')
      .pipe(cached('lib')).pipe(gulp.dest('dist/lib'));

  gulp.src('src/gif.worker.js')
      .pipe(cached('lib')).pipe(gulp.dest('dist'));

  // gulp.src('src/fonts/**/*')
  //     .pipe(cached('font'))
  //     .pipe(gulp.dest('dist/fonts'))// 将预处理字体复制到 dist/font
  return gulp.src('src/*.html')
    // .pipe(fileinclude()) // include html
    .pipe(rev()) // 生成并插入 MD5
    .pipe(gulp.dest('dist/'))
});

// clean
gulp.task('clean', function() {
  return del('dist/**/*');
});

// build，关连执行全部编译任务
gulp.task('build', ['styles', 'scripts', 'images'], function () {
  gulp.start('html');
});

// default 默认任务，依赖清空任务
gulp.task('default', ['clean'], function() {  
    gulp.start('build');
});

// watch 开启本地服务器并监听
gulp.task('watch', function() {
  browserSync.init({
    server: {
      baseDir: 'dist' // 在 dist 目录下启动本地服务器环境，自动启动默认浏览器
    }
  });

  // 监控 SASS 文件，有变动则执行CSS注入
  gulp.watch('src/css/**/*.scss', ['styleReload']);
  // 监控 js 文件，有变动则执行 script 任务
  gulp.watch('src/js/**/*.js', ['scripts']);
  // 监控图片文件，有变动则执行 image 任务
  gulp.watch('src/img/**/*', ['images']);
  // 监控 html 文件，有变动则执行 html 任务
  gulp.watch('src/**/*.html', ['html']);
  // 监控 dist 目录下除 css 目录以外的变动（如js，图片等），则自动刷新页面
  gulp.watch(['dist/**/*', '!dist/css/**/*']).on('change', browserSync.reload);

});