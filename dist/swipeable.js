'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (WrappedComponent) {
  return function (_React$PureComponent) {
    _inherits(Swipeable, _React$PureComponent);

    function Swipeable() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, Swipeable);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Swipeable.__proto__ || Object.getPrototypeOf(Swipeable)).call.apply(_ref, [this].concat(args))), _this), _this.initialX = 0, _this.initialY = 0, _this.delta = { x: 0, y: 0 }, _this.prevDelta = { x: 0, y: 0 }, _this.direction = -1, _this.shouldBlockScrollY = false, _this.shouldBlockScrollX = false, _this.handleTouchStart = function (e) {
        _this.shouldBlockScrollX = false;
        _this.shouldBlockScrollY = false;
        if (_this.isStopPropagationAllowed() && _this.wci.props.stopPropagation) {
          e.stopPropagation();
        }
        if (e.targetTouches.length) {
          _this.initialX = e.targetTouches[0].clientX;
          _this.initialY = e.targetTouches[0].clientY;
          _this.wci.swipeStart && _this.wci.swipeStart(e);
        }
        if (_this.shouldBlockScrollY) {
          e.preventDefault();
        }
      }, _this.handleTouchMove = function (e) {
        if (_this.isStopPropagationAllowed(IS_STRICT) && _this.wci.props.stopPropagation) {
          e.stopPropagation();
        }
        if (!e.targetTouches.length) {
          return;
        }
        var nextDelta = {
          x: _this.initialX - e.targetTouches[0].clientX,
          y: _this.initialY - e.targetTouches[0].clientY
        };
        _this.getDirection(nextDelta);
        _this.setDelta(nextDelta);
        switch (_this.direction) {
          case DIRECTION_LEFT:
            if (!_this.shouldBlockScrollX) {
              _this.shouldBlockScrollY = true;
              if (_this.wci.swipingLeft && _this.isStopPropagationAllowed(IS_STRICT)) {
                _this.wci.swipingLeft(e, _this.delta);
              }
            }
            break;
          case DIRECTION_RIGHT:
            if (!_this.shouldBlockScrollX) {
              _this.shouldBlockScrollY = true;
              if (_this.wci.swipingRight && _this.isStopPropagationAllowed(IS_STRICT)) {
                _this.wci.swipingRight(e, _this.delta);
              }
            }
            break;
          case DIRECTION_UP:
            if (!_this.shouldBlockScrollY) {
              _this.shouldBlockScrollX = true;
            }
            _this.wci.swipingUp && _this.wci.swipingUp(e, _this.delta);
            break;
          case DIRECTION_DOWN:
            if (!_this.shouldBlockScrollY) {
              _this.shouldBlockScrollX = true;
            }
            _this.wci.swipingDown && _this.wci.swipingDown(e, _this.delta);
            break;
          default:
        }
        _this.wci.swiping && _this.wci.swiping(e, _this.delta);
        _this.setDelta(nextDelta);

        _this.shouldBlockScrollY && e.preventDefault();
      }, _this.handleTouchEnd = function (e) {
        if (_this.isStopPropagationAllowed(IS_STRICT) && _this.wci.props.stopPropagation) {
          e.stopPropagation();
        }

        _this.delta = {
          x: _this.shouldBlockScrollX ? 0 : _this.delta.x,
          y: _this.shouldBlockScrollY ? 0 : _this.delta.y
        };

        if (_this.delta.x !== 0) {
          _this.wci.swiped && _this.wci.swiped(e, _this.delta);
        }

        _this.shouldBlockScrollX = false;
        _this.shouldBlockScrollY = false;
        _this.setDelta({ x: 0, y: 0 });
        _this.prevDelta = { x: 0, y: 0 };
        if (_this.shouldBlockScrollY) {
          e.preventDefault();
        }
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(Swipeable, [{
      key: 'getDirection',
      value: function getDirection(nextDelta) {
        var deltaX = Math.abs(nextDelta.x - this.prevDelta.x);
        var deltaY = Math.abs(nextDelta.y - this.prevDelta.y);
        var isHorizontal = deltaX > deltaY;

        if (isHorizontal) {
          this.direction = nextDelta.x > this.prevDelta.x ? DIRECTION_LEFT : DIRECTION_RIGHT;
        } else {
          this.direction = nextDelta.y > this.prevDelta.y ? DIRECTION_UP : DIRECTION_DOWN;
        }
      }
    }, {
      key: 'isStopPropagationAllowed',
      value: function isStopPropagationAllowed(isStrict) {
        var isFirst = this.wci.currentIndex === 0;
        var isSwippingFirst = isStrict ? this.wci.swippingDelta > 0 : this.wci.swippingDelta >= 0;
        var isLast = this.wci.currentIndex === this.wci.props.children.length - 1;
        var isSwippingLast = isStrict ? -this.wci.swippingDelta > this.wci.widthTotal - this.wci.itemWidth : -this.wci.swippingDelta >= this.wci.widthTotal - this.wci.itemWidth;
        var isSwippingInner = isFirst && isSwippingFirst || isLast && isSwippingLast;
        return !this.wci.props.isRelatedInnerSlider || !isSwippingInner;
      }

      // https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77

    }, {
      key: 'setIosHack',
      value: function setIosHack() {
        if (!window.iosPreventDefaultScroll) {
          window.addEventListener('touchmove', function () {});
          window.iosPreventDefaultScroll = 1;
        }
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.wci.innerNode.addEventListener('touchstart', this.handleTouchStart, false);
        this.wci.innerNode.addEventListener('touchmove', this.handleTouchMove, false);
        this.wci.innerNode.addEventListener('touchend', this.handleTouchEnd, false);
        this.wci.innerNode.addEventListener('touchcancel', this.handleTouchEnd, false);
        this.setIosHack();
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this.wci.innerNode.removeEventListener('touchstart', this.handleTouchStart);
        this.wci.innerNode.removeEventListener('touchmove', this.handleTouchMove);
        this.wci.innerNode.removeEventListener('touchend', this.handleTouchEnd);
        this.wci.innerNode.removeEventListener('touchcancel', this.handleTouchEnd);
      }
    }, {
      key: 'setDelta',
      value: function setDelta(nextDelta) {
        this.prevDelta = Object.assign({}, this.delta);
        this.delta = nextDelta;
      }
    }, {
      key: 'render',
      value: function render() {
        var _this2 = this;

        return _react2.default.createElement(WrappedComponent, _extends({}, this.props, { ref: function ref(node) {
            return _this2.wci = node;
          } }));
      }
    }]);

    return Swipeable;
  }(_react2.default.PureComponent);
};

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DIRECTION_LEFT = 0;
var DIRECTION_RIGHT = 1;
var DIRECTION_UP = 2;
var DIRECTION_DOWN = 3;
var IS_STRICT = true;

module.exports = exports['default'];