// Basically, react-router-redux connect history to store, so we can use store to do actions with history
// For exp: if we want to navigate history pushState, we have to do history pushState()
// By redux connected to history, we will have history.push in props of all connected component -> connect(Component)
// Otherwise we also have action to dispatch by { push } 'react-router-redux'
// For exp: store.dispatch(push('/')) => go to root
// we also need routerReducer from react-router-redux and combine it in reducers

import { createStore, applyMiddleware, compose } from 'redux';
import { createBrowserHistory,createLocation } from 'history';
import { routerMiddleware, push } from 'react-router-redux';
import thunk from 'redux-thunk';

// DevTools and Devtool Extension cannot run together, otherwise conflict will occur
// import DevTools from './components/DevTools';

import appReducers from './reducers';

import basename from 'base.config';

const history = process.env.BROWSER ? createBrowserHistory({ basename: basename }) : createLocation();

// Development Side

const developmentStore = preloadedState => {

  const devTool = process.env.BROWSER ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__: null : null;
  const composeEnhancers = process.env.BROWSER ? devTool ? devTool : compose : compose; // process.env.BROWSER ? devtool ? devtool : compose : compose;
  const store = createStore(
    appReducers,
    preloadedState,
    // typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    composeEnhancers(
      // IMPORTANT!!!
      // Basically Middleware is the gate sitting in the middle of action -> middleware -> reducer
      // That's why, thunk can hook to the action and run the function before passing it to the reducers
      // in short, all middleware like thunk, promise ... is running with same function which is process the action passed by
      // and then return to reducer
      applyMiddleware(
        thunk,
        routerMiddleware(history)
      )
    )
  );

  store.customHistory = history;
  store.basename = basename;

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./reducers', () => {
      console.log('[HMR]: replaced --> [Reducer]');
      const nextRootReducer = require('./reducers').default;
      store.replaceReducer(nextRootReducer);
      console.log('Dev Store Replaced: ', store.getState());
    })
  }

  console.log('Dev Store inited: ', (process.env.BROWSER ? store.getState() : 'No Log in ServerSide'));
  return store;
};


// Production & Build Server Side
const productionStore = preloadedState => {

  let store = createStore(
    appReducers,
    preloadedState,
    applyMiddleware(
      thunk,
      routerMiddleware(history)
    )
  );

  store.customHistory = history;
  store.basename = basename;

  console.log('Build Store inited: ', store.getState());
  return store;
};

// For debugging
// if (process.env.BROWSER) {
//   window.info = {
//     store: developmentStore,
//     push: push
//   };
// }

export default process.env.NODE_ENV === 'development' ? developmentStore : productionStore;
