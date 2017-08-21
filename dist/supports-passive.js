'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var supportsPassive = false;
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

console.log('test passive event', supportsPassive);
exports.default = supportsPassive;
module.exports = exports['default'];