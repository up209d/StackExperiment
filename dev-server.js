// * DEV SERVER * //
// For DEV SERVER, the file is caching in memory or filesystem cache
// It is not actually the real dist folder but have same abstract
// We can call it a shadow copy of dist folder
// So imagine working with that folder is also same as working with dist folder
// Since we working with the local dev server so every file will be served from the root path
// which is 'localhost' Exp: src=/image.jpg mean localhost/image.jpg or src=image.jpg also same as localhost/image.jpg

// It is different from the BUILD SERVER that we might have to deal with sub path of root path
// Exp: Your project is sitting in abc.com/yourProject/**.*
// In this case it doesn't work if we use Public Path as '/' mean it will start from the root folder
// which is abc.com and the serving file path might never exist
// Exp: we use Public Path is : / . That will be added in the beginning space of every 'src' attr
// We want image.jpg -> src=/image.jpg mean src=abc.com/image.jpg
// but our image.jpg is actually in abc.com/yourProject/image.jpg
// So it wont work we have to use Public Path is : ''
// so src=image.jpg mean image.jpg in current folder which is abc.com/yourProject/image.jpg
// It shall lead to problems of history-api-fallback that when your request like this
// abc.com/yourProject/afwfaw/waf/aw/f/aw/f/dawdjaiwdjaow/image.jpg
// So the current folder will be never exist.
// Then we have to do the server side routing to
// serve the static assets files such as js, images, css, font, json
// See Build Server information for further solution.

process.env.NODE_ENV = 'development';

import path from 'path';
import express from 'express';
import cors from 'cors';
import webpack from 'webpack';

import webpackConfig from './webpack.config.development';

import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import hostConfig from './host.config';
import portfinder from 'port-finder';

import React from 'react';
import ReactDOMServer from 'react-dom/server';

const app = express();
const compiler = webpack(webpackConfig);

import fs from 'fs';
let logFile = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});

// globalStats will keep up to date with stats from webpack every time its recompiled
let globalStats = {};

function getStats() {
  return globalStats.toJson ? globalStats.toJson() : null;
}

// Require Hack which get stats from webpack to render assets paths
let Module = require('module');
let _require = Module.prototype.require;
Module.prototype.require = function() {
  let currentPath = arguments[0];
  // let currentFilename = currentPath.substring(currentPath.lastIndexOf('/')+1,currentPath.length);
  // let currentFileext = currentPath.substring(currentPath.lastIndexOf('.')+1,currentPath.length);
  // console.log(currentFilename,currentFileext,currentFileext.length);
  try {
    return _require.call(this,arguments[0]);
  } catch (err) {
    let currentStats = getStats();
    if (currentStats) {
      let currentModules = currentStats.modules;
      let userRequestList = {};

      // Create this refs array for querying performance
      currentModules.forEach((currentModule)=>{
        if (currentModule.reasons && currentModule.assets) {
          if (currentModule.reasons.length > 0 && currentModule.assets.length > 0) {
            currentModule.reasons.forEach((reason)=>{
              userRequestList[reason.userRequest] = currentModule.assets[0];
            })
          }
        }
      });
      // console.log('====== NODE FALLBACK: ',currentPath);
      // err: {"code":"MODULE_NOT_FOUND"}
      // It is unsupport importing file, also can be the relative path is not valid
      // We dont care, we just want to figure out where webpack put that file in real bundle folder
      // let foundIndex = currentModules.findIndex(function(currentModule){
      //   if (currentModule.reasons.length) {
      //     return currentModule.reasons[0].userRequest === currentPath;
      //   } else {
      //     return false;
      //   }
      // });
      // return foundIndex >= 0 ? currentStats.publicPath + currentModules[foundIndex].assets[0] : currentPath;
      // console.log(userRequestList);
      return userRequestList[currentPath] ? currentStats.publicPath + userRequestList[currentPath] : currentStats.publicPath + currentPath;
    } else {
      console.log('ERROR: '); //err
    }
  }
};

// Enable CORS
app.use(cors());

// Apply Dev Middleware to Express
app.use(
  webpackDevMiddleware(compiler,{
    // Serve Render
    serverSideRender: true,
    // Serving path for local node
    contentBase: webpackConfig.output.path,
    // Hot module reload
    hot: true,
    // Public Path for server online serving
    publicPath: webpackConfig.output.publicPath,
    // Display info to terminal log
    noInfo: true,
    // No display stats working process to terminal log
    quite: true,
    stats: {
      // Terminal console color
      colors: true
    }
  })
);

// Apply Hot Middleware to Express
app.use(webpackHotMiddleware(compiler));

// So firstly, all the requests are passed through the webpackDevMiddlerware and webpackHotMiddleware
// And then if it has nothing to do (some non-exist url) those will call next() so
// It will fallback to the process below, and we can treat all un-certain requests by
// sending the content of index.html (processed by WebpackHTMLplugin)
// Since the DEV SERVER is serving the dist folder in caching (memory or fileSystem)
// We cannot call any file directly from real dist folder, we have to use compiler.outputFileSystem as fs (file serving)
// If we meet the readFileSystem error, that s because of webpack html plugin
// It failed to cache a index.html file, so we should run webpack build first to test
// It will trigger Html webpack plugin to cache

app.use(function (req, res, next) {
  // Update Global Stats to inject it in require hack
  globalStats = res.locals.webpackStats;

  // console.log('Fallback Request URL: ',req.url);
  let filename = path.join(compiler.outputPath,'main.html');
  // console.log(compiler.outputFileSystem);
  compiler.outputFileSystem.readFile(filename, 'utf-8', function(err, result){
    if (err) {
      return next(err);
    }
    // let file = fs.readFileSync('./src/js/components/pages/Home.js','utf-8');
    // console.log(file);
    // logFile.write(require.cache);
    // delete require.cache['/Users/up209d/Desktop/Datalabs/react_webpack_express/src/js/components/pages/Home.js'];
    // delete require.cache['/Users/up209d/Desktop/Datalabs/react_webpack_express/src/js/router.js'];

    // Clear Require Cache
    // require.cache = {};

    try {
      const storeGenerator = require('./src/js/store').default;
      const store = storeGenerator();
      let ServerRouter = require('./src/js/router').ServerRouter;
      let context = {};
      let content = ReactDOMServer.renderToString(<ServerRouter store={store} location={req.url} context={context}/>);
      result = result.replace('%-STATIC-CONTENT-%',content);

      res.set('content-type','text/html');
      res.send(result);
      res.end();
    } catch (err) {
      console.log(err);
      res.set('content-type','text/html');
      res.send(result);
      res.end();
    }
  });
});

// Start the Server

// Find free port with base port
portfinder.basePort = hostConfig.hostPort;
portfinder.getPort(function(err,port){
  if (err) {
    console.log(err)
  } else {
    const server = app.listen(port, function(err) {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log('----------------------------------------------------------');
        console.log();
        console.log('\x1b[36m','Server Started at Port: ', 'http://'+hostConfig.hostLanIP +':'+port);
        console.log('\x1b[37m');
        console.log('----------------------------------------------------------');
        console.log('Please, use the PublicPath above to work with browser for stability!');
        console.log();
        console.log('Waiting for Webpack Bundling ...');
        // require('opn')('http://' + hostConfig.hostLanIP + ':' + hostConfig.hostPort, {
        //   app: 'google chrome'
        // });
      }
    });
    server.keepAliveTimeout = 6000000;
  };
});

// Reset Cache each time file changes
// Otherwise ReactDOM Render to String wont do the job because of caching in node require()
// compiler.watch({},function(err,stats){
//   // logFile.write(JSON.stringify(stats,censor(stats)));
//   // console.log(stats.compilation.fileDependencies);
//
//   // Everytime File Changes, Reset the require cache for all .js file
//   stats.compilation.fileDependencies.map((dependency)=>{
//     if (dependency.match(/(\/src\/)(.*)\.(jsx?)$/) !== null) {
//       console.log(dependency);
//       delete require.cache[dependency];
//     }
//   });
// });
