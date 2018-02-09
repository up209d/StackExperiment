import basename from 'base.config';
import jQuery from 'jquery';

const utils = {
  mobileDetect: () => {
    if (process.env.BROWSER) {
      let MobileDetect = require('mobile-detect');
      let md = new MobileDetect(window.navigator.userAgent);
      return md;
    } else {
      return null;
    }
  },
  debounce: function(func,wait,immediate) {
    let timeout;
    return function() {
      let context = this;
      let args = arguments;
      let later = function() {
        timeout = null;
        if (!immediate) {
          func.apply(context,args);
        }
      };
      let callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(func,wait);
      if (callNow) {
        func.apply(context,args);
      }
    }
  },
  uniqueKey: function() {
    return Math.random().toString(36).substr(2, 9);
  },
  // Test if a variable is not undefined
  isSet: function(e) {
    if (typeof e === 'undefined') {
      return false;
    } else {
      return true;
    }
  },
  isEmpty: function(object) {
    if (object instanceof Array) {
      return object.length <= 0;
    } else {
      return Object.keys(object).length <= 0;
    }
  },
  isNotEmpty: function(object) {
    if (object instanceof Array) {
      return object.length > 0;
    } else {
      return Object.keys(object).length > 0;
    }
  },
  withBase: (url)=>{
    let version = __webpack_hash__ ? '?v=' + __webpack_hash__ : '';
    return basename ? (basename + '/' + url) + version : ('/' + url) + version;
  },
  toRem: (px) => {
    return parseInt(px)/16 + 'rem';
  },
  toggleClassNames: (object = {}) => {
    let classNames = [];
    if (object instanceof Array) {
      classNames = object.map(function(key){
        if (key) {
          return key;
        }
      });
      return classNames.join(' ');
    } else {
      classNames = Object.keys(object).map(function(key){
        if (object[key]) {
          return key;
        }
      });
      return classNames.join(' ');
    }
  },
  bindToThis: (self = this,methods = []) => {
    methods.forEach(prop=>{
      self[prop] = self[prop].bind(self);
    });
    return self;
  },
  //
  // PRINT REDUCER ACTION TYPES & ACTIONS
  //
  createComboRedux: (e) => {
    let event = e.toUpperCase();
    let actions = {};
    let result = '';

    actions[event+'_REQUEST'] = event+'_REQUEST';
    actions[event+'_SUCCESS'] = event+'_SUCCESS';
    actions[event+'_FAILURE'] = event+'_FAILURE';

    result += `
      // ACTION TYPES
        ${event+'_REQUEST: \''+event+'_REQUEST\''}
        ${event+'_SUCCESS: \''+event+'_SUCCESS\''}
        ${event+'_FAILURE: \''+event+'_FAILURE\''}
    `;

    result += `
      // ACTIONS
    `;

    Object.keys(actions).forEach((action)=>{
      let camelCase = action.toLowerCase().replace(/_./g,(letter)=>{
        return letter.replace('_','').toUpperCase();
      });
      result += `  
        export function ${camelCase}() {
          return {
            type: actionTypes.${actions[action]},
          }
        };
      `;
    });

    Object.keys(actions).forEach((action)=>{
      result += `
      // REDUCER
        case types.${action}: {
          return {
            ...state,
            ...action.payload
          }
        }
      `;
    });

    console.log(result);
    return result;

  },
  actionTypesExport: (types = [],log = false) => {
    let typesObject = {};
    types.forEach(type=>{
      typesObject[type] = type;
    });

    if (log) { console.log(typesObject) }

    return typesObject;
  },
  printActions: (actionTypes = {}) => {
    let result = '';
    Object.keys(actionTypes).forEach((type)=>{
      let newType = type.toLowerCase().split('_').map((each,index)=>{
        return index ? each.replace(each.charAt(0),each.charAt(0).toUpperCase()) : each;
      }).join('');

      result += `
        export function ${newType}() {
          return {
            type: actionTypes.${actionTypes[type]},
          }
        }`;
    });
    console.log(result);
    return result;
  },
  printReducer: (actionTypes = {}) => {
    let result = '';
    Object.keys(actionTypes).forEach((type)=>{
      let newType = type.toLowerCase().split('_').map((each,index)=>{
        return index ? each.replace(each.charAt(0),each.charAt(0).toUpperCase()) : each;
      }).join('');

      result += `
        case '${type}': {
          return {
            ...state,
            ...action.payload
          }
        }
  
        `;
    });
    console.log(result);
    return result;
  },
  //
  // AJAX REQUEST
  // You can decide which library you gonna use here jQuery Ajax or Axios
  // arrow function does not have it own context to bind, so we have to use normal blank function here
  ajax: process.env.BROWSER ? jQuery.ajax : (function() {
    let self = this;
    self.done = () => { return self };
    self.fail = () => { return self };
    self.then = () => { return self };
    return self;
  }).bind({}),
  isSet: (e) => {
    if (typeof e === 'undefined') {
      return false;
    } else {
      return true;
    }
  },
  //
  // TRIGGER
  // Trigger a specific event for element (click,mousedown,mousein)
  trigger: (el,eventType) => {
    if (eventType) {
      if (service.isIE()) {
        let e = document.createEvent('Event');
        e.initEvent(eventType, true, true);
        if (el) {
          $timeout(function(){
            el.dispatchEvent(e);
          });
        }
      } else {
        let e = new Event(eventType);
        if (el) {
          $timeout(function(){
            el.dispatchEvent(e,true,true);
          });
        }
      }
    }
    return true;
  },
  //
  // BROWSER DETECTION
  // Detect whether browser is any of these below
  isIE: () => {
    return !!navigator.userAgent.match(/Trident/g) || !!navigator.userAgent.match(/MSIE/g);
  },
  isSafari: () => {
    let isSafari = !!navigator.userAgent.match(/safari/gi) || !!navigator.userAgent.match(/safari/gi);
    let isChrome = !!navigator.userAgent.match(/chrome/gi) || !!navigator.userAgent.match(/chrome/gi);
    return isSafari && !isChrome;
  },
  isChrome: () => {
    let isChrome = !!navigator.userAgent.match(/chrome/gi) || !!navigator.userAgent.match(/chrome/gi);
    return isChrome;
  },
  isFireFox: () => {
    let isFireFox = !!navigator.userAgent.match(/firefox/gi) || !!navigator.userAgent.match(/firefox/gi);
    return isFireFox;
  },
  // Check Handheld
  isHandheld: function() {
    if (process.env.BROWSER) {
      let browserDetection = new MobileDetect(window.navigator.userAgent);
      if (browserDetection.mobile() || browserDetection.phone() || browserDetection.tablet()) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  },
  //
  // MAP RANGE
  // Map a number from a range to other range
  mapRange: (value, from, to, newFrom, newTo) => {
    if (to === from) {
      return to;
    } else {
      return (((value - from) / (to - from)) * (newTo - newFrom)) + newFrom;
    }
  },
};


if (process.env.BROWSER) {
  window.utils = utils;
}

export default utils;

