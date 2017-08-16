import gulp from 'gulp';
import gulpif from 'gulp-if';
import { log, colors} from 'gulp-util';
import named from 'vinyl-named';
import webpack from 'webpack';
import gulpWebpack from 'webpack-stream';
import plumber from 'gulp-plumber';
import livereload from 'gulp-livereload';
import args from './lib/args';

const ENV = args.production ? 'production' : 'development';

const packHost = args.production ? 'https://www.hunthelper.com' : 'https://localhost.ssl:5000'

gulp.task('scripts', (cb) => {
  return gulp.src(['app/scripts/*.js'])
    .pipe(plumber({
      errorHandler: function() {
        // Webpack will log the errors
      }
    }))
    .pipe(named())
    .pipe(gulpWebpack({
      devtool: args.sourcemaps ? 'inline-source-map': null,
      watch: args.watch,
      plugins: [
        new webpack.DefinePlugin({
          'process.env': {
            'NODE_ENV': JSON.stringify(ENV)
          },
          '__ENV__': JSON.stringify(ENV),
          '__VENDOR__': JSON.stringify(args.vendor),
          HH_ENVIRONMENT: JSON.stringify(ENV),
          __HOST__: JSON.stringify(packHost),
        }),
      ].concat(args.production ? [
        new webpack.optimize.UglifyJsPlugin()
      ] : []),
      module: {
        preLoaders: [{
          test: /\.js$/,
          loader: 'eslint-loader',
          exclude: /node_modules/
        }],
        loaders: [{
          test: /\.js$/,
          loader: 'babel-loader'
        },{
          test: /\.vue$/,
          loader: 'vue-loader'
        },
        {
          test: /\.(jpg|png|svg)$/,
          loader: 'url-loader',
          options: {
            limit: 25000,
          },
        },
        {
          test: /\.(vue|js)$/,
          loader: 'string-replace',
          query: {
            search: '__HOST__',
            replace: packHost
          }
        }]
      },
      resolve: {
        alias: {
          'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
        }
      },
      eslint: {
        configFile: '.eslintrc'
      }
    }, null, (err, stats) => {
      log(`Finished '${colors.cyan('scripts')}'`, stats.toString({
        chunks: false,
        colors: true,
        cached: false,
        children: false
      }));
    }))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()));
});
