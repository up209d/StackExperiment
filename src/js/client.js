import '../scss/app.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import storeGenerator from './store';
const store = storeGenerator();

window.store = store;

// GA for App, this shall work by controlling from GA React Component
console.log('GA_TRACKING_ID: ',window.GA_TRACKING_ID);

import ReactGA from 'react-ga';

ReactGA.initialize(
  window.GA_TRACKING_ID,
  {
    debug: true,
    name: 'mainTracker',
    cookieDomain: 'auto'
  }
);

ReactGA.ga(
  'create',
  window.GA_TRACKING_ID,
  {
    'name': 'mainTracker',
    'cookieDomain': 'auto'
  }
);

import basename from 'base.config';

// Tracking the path for GTag
let gtagTracking = function(location){
  console.log('GTag Tracked: ',window.GA_TRACKING_ID, ' - ',basename + location.pathname);
  if (gtag) {
    gtag('config', window.GA_TRACKING_ID, {'page_path': basename + location.pathname});
  }
};
store.customHistory.listen(gtagTracking);
gtagTracking(store.customHistory.location);

let AppRouter = require('./router').AppRouter;

// import Vendor from 'bundle-loader!./vendor/vendor'; // ./../../node_modules/
// Vendor(result=>{console.log(result.default);}); // VENDOR -> see vendor.js

import WebFontLoader from 'webfontloader';

// warnings=false to disable annoying warnings
const DOMRenderer = (Component) => {
  ReactDOM.hydrate(
    <AppContainer warnings={true} >
      <Component store={store} />
    </AppContainer>
    ,document.getElementById('root'));
};

// Debug
window.nodeEnv = process.env;

WebFontLoader.load({
  google: {
    families: ['Roboto:300,400,900']
  },
  active: ()=>{
    // Make it run in queue so the unstyle content at flash wont show up
    setTimeout(function(){

      document.getElementById('preload').setAttribute('class','hidden');
      console.log('Roboto loaded!');
      setTimeout(function(){
        document.getElementById('preload')
          .parentNode
          .removeChild(document.getElementById('preload'));
      },500);

      DOMRenderer(AppRouter);

      // If any change to app
      if (module.hot) {
        // Whenever a new version of App.js is available
        module.hot.accept('./router', function () {
          console.log('[HMR]: replaced --> [Components]');
          AppRouter = require('./router').AppRouter;
          DOMRenderer(AppRouter);
        });
      }

    },300);
  }
});
