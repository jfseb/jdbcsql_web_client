
//const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: 'production',
    //entry: "./src/index.tsx",
  entry : './src/web/qbetable.tsx',
  output: {
    filename: 'qbetable.js',
    path: __dirname + '/app/public/js'
  },
  watch : false,
    // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',
  resolve: {
    extensions: [".tsx", ".js"]
        // Add '.ts' and '.tsx' as resolvable extensions.
  //  extensions: ['','.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  plugins : [],
  module: {
    rules: [
        // { test: /\.tsx?$/, loader: 'ts-loader?configFileName=/src/web/tsconfig.json' }
         { test: /\.tsx?$/, loader: 'ts-loader?configFile=./src/web/tsconfig2.json',
         options: {
          configFile : 'tsconfig.web.json',
          reportFiles: ['src/**/*.{ts,tsx}', '!src/skip.ts'] }
        }
        // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
        //  { test: /\.tsx?$/, loader: 'awesome-typescript-loader?configFileName=/src/web/tsconfig.json' }
    ]
/*
    preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: 'source-map-loader' }
    ]
    */
  },
  /*
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        uglifyOptions: {
          output: {
            comments: false
          },
          compress: {
            unsafe_comps: true,
            properties: true,
            keep_fargs: false,
            pure_getters: true,
            collapse_vars: true,
            unsafe: true,
            warnings: false,
            screw_ie8: true,
            sequences: true,
            dead_code: true,
            drop_debugger: true,
            comparisons: true,
            conditionals: true,
            evaluate: true,
            booleans: true,
            loops: true,
            unused: true,
            hoist_funs: true,
            if_return: true,
            join_vars: true,
            cascade: true,
            drop_console: true
          }
        }
      })
    ]
  },
*/
    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
};
