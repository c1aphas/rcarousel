'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (WrappedComponent) {
  return function (_React$PureComponent) {
    _inherits(Swipeable, _React$PureComponent);

    function Swipeable(props) {
      _classCallCheck(this, Swipeable);

      var _this = _possibleConstructorReturn(this, (Swipeable.__proto__ || Object.getPrototypeOf(Swipeable)).call(this, props));

      _this.initialX = 0;
      _this.initialY = 0;
      _this.delta = { x: 0, y: 0 };
      _this.prevDelta = { x: 0, y: 0 };
      _this.direction = -1;
      _this.shouldBlockScrollY = false;
      _this.shouldBlockScrollX = false;

      _this.handleTouchStart = _this.handleTouchStart.bind(_this);
      _this.handleTouchMove = _this.handleTouchMove.bind(_this);
      _this.handleTouchEnd = _this.handleTouchEnd.bind(_this);
      return _this;
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
      key: 'handleTouchStart',
      value: function handleTouchStart(e) {
        this.shouldBlockScrollX = false;
        this.shouldBlockScrollY = false;
        if (this.isStopPropagationAllowed() && this.wci.props.stopPropagation) {
          e.stopPropagation();
        }
        if (e.targetTouches.length) {
          this.initialX = e.targetTouches[0].clientX;
          this.initialY = e.targetTouches[0].clientY;
          this.wci.swipeStart && this.wci.swipeStart(e);
        }
        if (this.shouldBlockScrollY) {
          e.preventDefault();
        }
      }
    }, {
      key: 'setDelta',
      value: function setDelta(nextDelta) {
        this.prevDelta = Object.assign({}, this.delta);
        this.delta = nextDelta;
      }
    }, {
      key: 'handleTouchMove',
      value: function handleTouchMove(e) {
        if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
          e.stopPropagation();
        }
        if (!e.targetTouches.length) {
          return;
        }
        var nextDelta = {
          x: this.initialX - e.targetTouches[0].clientX,
          y: this.initialY - e.targetTouches[0].clientY
        };
        this.getDirection(nextDelta);
        switch (this.direction) {
          case DIRECTION_LEFT:
            if (!this.shouldBlockScrollX) {
              this.shouldBlockScrollY = true;
              if (this.wci.swipingLeft && this.isStopPropagationAllowed(IS_STRICT)) {
                this.wci.swipingLeft(e, this.delta);
              }
            }
            break;
          case DIRECTION_RIGHT:
            if (!this.shouldBlockScrollX) {
              this.shouldBlockScrollY = true;
              if (this.wci.swipingRight && this.isStopPropagationAllowed(IS_STRICT)) {
                this.wci.swipingRight(e, this.delta);
              }
            }
            break;
          case DIRECTION_UP:
            if (!this.shouldBlockScrollY) {
              this.shouldBlockScrollX = true;
            }
            this.wci.swipingUp && this.wci.swipingUp(e, this.delta);
            break;
          case DIRECTION_DOWN:
            if (!this.shouldBlockScrollY) {
              this.shouldBlockScrollX = true;
            }
            this.wci.swipingDown && this.wci.swipingDown(e, this.delta);
            break;
          default:
        }
        this.wci.swiping && this.wci.swiping(e, this.delta);
        this.setDelta(nextDelta);

        this.shouldBlockScrollY && e.preventDefault();
      }
    }, {
      key: 'handleTouchEnd',
      value: function handleTouchEnd(e) {
        if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
          e.stopPropagation();
        }

        this.delta = {
          x: this.shouldBlockScrollX ? 0 : this.delta.x,
          y: this.shouldBlockScrollY ? 0 : this.delta.y
        };

        if (this.delta.x !== 0) {
          this.wci.swiped && this.wci.swiped(e, this.delta);
        }

        this.shouldBlockScrollX = false;
        this.shouldBlockScrollY = false;
        this.setDelta({ x: 0, y: 0 });
        this.prevDelta = { x: 0, y: 0 };
        if (this.shouldBlockScrollY) {
          e.preventDefault();
        }
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