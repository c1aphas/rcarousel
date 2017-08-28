'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function isBrowserSupportPassiveEventListener() {
  var supportsPassive = false;
  if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' && typeof window.addEventListener === 'function') {
    try {
      var opts = Object.defineProperty({}, 'passive', {
        get: function get() {
          supportsPassive = true;
        }
      });
      window.addEventListener('test', null, opts);
    } catch (e) {
      // unsupport
    }
  }

  return supportsPassive;
}

exports.default = isBrowserSupportPassiveEventListener();
module.exports = exports['default'];