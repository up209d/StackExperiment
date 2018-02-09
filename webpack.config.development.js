import path from 'path';
import webpack from 'webpack';
import fs from 'fs';

import CopyWebpackPlugin from 'copy-webpack-plugin';
import HTMLWebpackPlugin from 'html-webpack-plugin';

process.env.NODE_ENV = 'development';

import basename from './base.config';

export default {
  // No hint warnings or errors are shown.
  performance: {
    hints: false
  },
  devtool: 'source-map',
  externals: {},
  watch: true,
  watchOptions: {
    ignored: /(node_modules|\.log$)/
  },
  entry: {
    appBundle: [
      'webpack-hot-middleware/client?reload=true',
      'react-hot-loader/patch',
      './src/js/client.js'
    ],
    vendorBundle: [
      // We have to include babel-polyfill even we dont use it anywhere
      // Since it will setup some runtime to make older browser like IE works
      // For exp: Promise will return error on IE 11 if without babel-polyfill
      'babel-polyfill'
    ]
  },
  plugins: [
    new ResetRequireCache(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    // If you re not using that, the vendor will be still kept in appBundle
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendorBundle',
      minChunks: function(module, count) {
        // Make sure all dependencies from node_modules come to vendorBundle
        return (/node_modules/).test(module.resource);
      }
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        BROWSER: JSON.stringify(true),
        BABEL_ENV: JSON.stringify('development')
      }
    }),
    // Inject index.html
    new HTMLWebpackPlugin({
      // If set it to index.html, so the express server will jump in it directly
      // So we cannot make the server rendering for the root url exp http://localhost:20987
      // Solution here is create template html with other than index.html
      filename: 'main.html', // avoid index.html to make all requests have to fallback to our api (see dev-server.js)
      hash: true, // add ?[build hash] to serving files to avoid caching
      favicon: './src/assets/images/favicon.ico',
      template: './src/index.html'
    }),
    // Copy Extras Files
    new CopyWebpackPlugin([
      // Remember the root folder for the destination is the global output path of config already
      // By default context of 'from' and 'to' is different
      // Context of 'from' is the root real folder in this case is '.'
      // Context of 'to'   is public path, it is already 'dist' as the root folder
      {
        from: './src/assets/images/favicon.ico',
        to: './favicon.[hash].ico' // It is already 'dist' as the root folder
      },
      {
        // Context is the way that we can use to manipulate the destination
        // for exp: copy from ./src/data so the path would be ./src/data
        // If we want the path doesn't contain ./src so we can remove that
        // by declare context ./src so, all path from 'from' and 'to' will start
        // from the context path, by default context = compiler.options.context
        // which is the root folder of compilation
        // context only apply to 'from'
        context: './src',
        from: './data/**/*.*',
        to: './[path][name].[ext]' // also can add [hash] [query] ?v=[hash]
      }
    ], {
      // Exclude file types to copy here
      ignore: [
        // Doesn't copy any files with a txt extension
        // '*.txt',
        // Doesn't copy any file, even if they start with a dot
        // '**/*',
        // Doesn't copy any file, except if they start with a dot
        // { glob: '**/*', dot: false }
      ],
      copyUnmodified: true
    })
  ],
  resolve: {
    modules: [
      // Resolve folders here
      path.resolve(__dirname + '/bower_components'),
      path.resolve(__dirname + '/node_modules'),
      path.resolve(__dirname + '/src/js/vendor'),
      path.resolve(__dirname + '/src/assets'),
      path.resolve(__dirname + '/src'),
      path.resolve(__dirname + '/')
    ],
    alias: {
      // Set alias shortcut to any folder here
      // In order to use alias add ~ for exp require('~IMAGE_DIR/abc.jpg')
      // This is caused by CSS Loader, it need ~ to detect alias
      ROOT_DIR: path.resolve(__dirname + '/'),
      SRC_DIR: path.resolve(__dirname + '/src'),
      ASSETS_DIR: path.resolve(__dirname + '/src/assets'),
      IMAGE_DIR: path.resolve(__dirname + '/src/assets/images')
    }
  },
  module: {
    // For nested rules use oneOf, that is a javascript switch and you can use
    // rules: [
    //  {
    //    // Root Rules
    //       oneOf: [
    //         {
    //           // Rule for Js
    //           test: /\.js$/
    //         },
    //         {
    //           // Rule for css
    //           test: /\.css$/
    //         },
    //         {
    //           // Rule for images
    //           test: /\.(png|jpg|gif|ico)$/,
    //           oneOf: [
    //             // Rule for each images or rule for querystring
    //             {
    //               // Rule for query string
    //               resourceQuery: /(ToDataURI)/
    //             },
    //             // the rest case Rule
    //             {
    //               // the rest case rule no need 'test' 'resourceQuery'
    //             }
    //           ]
    //         }
    //       ]
    //  }
    // ],
    rules: [
      // This is root Rule with a switch oneOf
      {
        // !!! Important
        // Normally, rules will run all the children rules inside,
        // If 2 rules overlap each other for exp: /\.css/ and /\.s?css/
        // So it will load 2 loaders, one in rule of css and after by one in rule of s?css
        // So, when it found first rule matched we need it skip the rest rules to exit
        // Think about javascript switch case: break;, so that is where "oneOf" switch shines
        oneOf: [

          // For anything in node_modules
          {
            // 'ansi regex' uses arrow function on exporting, IE 11 wont run arrow function natively
            // We definitely need to transform that before it sit in webpack package
            test: /ansi/,
            // query: //, // Not only 'test', we also can use 'resourceQuery' to match the case
            use: [
              {
                loader: 'babel-loader'
              }
            ]
          },

          // For JS & JSX files
          {
            test: /\.jsx?$/,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'react-hot-loader/webpack'
              },
              {
                loader: 'babel-loader'
              }
            ]
          },

          // For CSS & SCSS files
          {
            test: /\.(css|scss)$/,
            // exclude: [/node_modules/], // We cant exclude because we need to import some dependencies style
            use: [
              {
                loader: 'style-loader'
              },
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                  importLoaders: 2
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  sourceMap: true
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: true
                }
              }
            ]
          },

          // Loader for font files
          {
            test: /\.eot$/,
            use: {
              loader: 'url-loader',
              options: {
                limit: 100000,
                mimetype: 'application/vnd.ms-fontobject',
                name: 'assets/fonts/[name].[ext]'
              }
            },
            exclude: [/node_modules/]
          },
          {
            test: /\.woff$/,
            use: {
              loader: 'url-loader',
              options: {
                limit: 100000,
                mimetype: 'application/font-woff',
                name: 'assets/fonts/[name].[ext]'
              }
            },
            exclude: [/node_modules/]
          },
          {
            test: /\.woff2$/,
            use: {
              loader: 'url-loader',
              options: {
                limit: 100000,
                mimetype: 'application/font-woff2',
                name: 'assets/fonts/[name].[ext]'
              }
            },
            exclude: [/node_modules/]
          },
          {
            test: /\.ttf$/,
            use: {
              loader: 'url-loader',
              options: {
                limit: 100000,
                mimetype: 'application/font-ttf',
                name: 'assets/fonts/[name].[ext]'
              }
            },
            exclude: [/node_modules/]
          },

          // Loader for images files
          {
            // We can also nested rule by oneOf
            test: /\.(jpe?g|png|gif|ico|svg)$/,
            exclude: [/node_modules/],
            oneOf: [
              {
                // Normally without resourceQuery webpack will not consider anything behind ?
                // Remember when resourceQuery is declare, webpack will expect '?' in the filePath
                // So all filePath without ? we be consider not match in the case
                // So the rest case without ? will have to declare
                resourceQuery: /File/,
                use: {
                  loader: 'file-loader',
                  options: {
                    name: 'assets/images/[name].[ext]'
                  }
                }
              },
              {
                resourceQuery: /Raw/,
                use: {
                  loader: 'raw-loader'
                }
              },
              {
                resourceQuery: /Data/,
                use: {
                  loader: 'url-loader',
                }
              },
              {
                // Special case if svg and url-loader need to set mimetype
                test: /\.svg$/,
                use: {
                  loader: 'url-loader',
                  options: {
                    limit: '10000',
                    mimetype: 'image/svg+xml',
                    name: 'assets/images/[name].[ext]'
                  }
                }
              },
              // Here is the rest case to fallback if none of those above matched
              {
                // We dont use any kind of match like test include exclude resourceQuery
                // So it will select all the case, which is the case of its parent
                // if its parents is root, it will select all files
                use: {
                  loader: 'url-loader',
                  options: {
                    limit: '10000',
                    name: 'assets/images/[name].[ext]'
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  },
  output: {
    // __dirname is the current folder that this script is running
    path: path.resolve(__dirname + '/dist' + basename),
    // Note: / after publicPath is vital, dont forget that
    publicPath: basename + '/', // Mean use the root url path as path,
    // start from the root folder by adding slash to the beginning of every 'src' attr
    filename: '[name].js' // In dev we might dont need hash number
  }
}

let statsLog = fs.createWriteStream(__dirname + '/stats.log', {
  flags: 'w'
});

function ResetRequireCache(options) {
  // Do smt with options object here
};

ResetRequireCache.prototype.apply = function (compiler) {

  // compiler.plugin("compilation", function(compilation, data) {
  //   data.normalModuleFactory.plugin("parser", function(parser, options) {
  //     parser.plugin('var Home',function(expr){
  //       console.log(expr);
  //       return true;
  //     });
  //   });
  // });

  compiler.plugin('done', function (stats) {
    // Log stats for debug
    const log = stats.toJson();
    statsLog.write(JSON.stringify(log));

    console.log('Global Context: ',compiler.options.context);

    // statsLog.write(JSON.stringify(Object.keys(require.cache)));

    // Clear the cache if of all file in ./src folder
    stats.compilation.fileDependencies.map((dependency) => {
      if (dependency.match(/(\/src\/)(.*)\.(jsx?)$/) !== null) {
        // console.log('------- Clear Cache: ', dependency); //dependency
        delete require.cache[dependency];
      }
    });
  });

  // compiler.plugin('emit', function (compilation,callback) {
  //   compilation.summarizeDependencies();
  //   // console.log(compilation.fileDependencies);
  //   // Now setup callbacks for accessing compilation steps:
  //   // console.log(compilation.summarizeDependencies());
  //   // compilation.fileDependencies.map((dependency) => {
  //   //   if (dependency.match(/(\/src\/)(.*)\.(jsx?)$/) !== null) {
  //   //     console.log(dependency);
  //   //     delete require.cache[dependency];
  //   //   }
  //   // });
  //   compilation.fileDependencies.map((dependency)=>{
  //    if (dependency.match(/(\/src\/)(.*)\.(jsx?)$/) !== null) {
  //      console.log(dependency);
  //      delete require.cache[dependency];
  //    }
  //   });
  //
  //   callback();
  // });
};

