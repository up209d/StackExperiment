import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

import {
  Router,
  BrowserRouter,
  HashRouter,
  StaticRouter,
  Switch,
  Redirect,
  Route
} from 'react-router-dom';

import { ConnectedRouter } from 'react-router-redux';

import Home from './components/pages/Home/Home';
import NotFound from './components/pages/NotFound/NotFound';

const SwitchRoute = () => (
  <Switch>
    <Route exact path="/notfound" component={NotFound} />
    <Route exact path="/" component={Home} />
    <Route exact path="/:state" component={Home} />
    <Route exact path="/:state/:school" component={Home} />
    <Route component={NotFound} />
  </Switch>
);

// Client Side
export const AppRouter = (props) => (
  <Provider store={props.store}>
    <ConnectedRouter history={props.store.customHistory}>
      <SwitchRoute/>
    </ConnectedRouter>
  </Provider>
);

// Client Side Static App
export const AppHashRouter = (props) => {
  return (
    <Provider store={props.store}>
      <HashRouter basename={props.store.basename}>
        <SwitchRoute/>
      </HashRouter>
    </Provider>
  )
};

// Server Side
export const ServerRouter = (props) => {
  return (
    <Provider store={props.store}>
      <StaticRouter basename={props.store.basename} location={props.location} context={props.context}>
        <SwitchRoute/>
      </StaticRouter>
    </Provider>
  )
};
