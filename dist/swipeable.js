'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = Swipeable.__proto__ || Object.getPrototypeOf(Swipeable)).call.apply(_ref, [this].concat(args))), _this), _this.initialX = 0, _this.initialY = 0, _this.delta = { x: 0, y: 0 }, _this.prevDelta = { x: 0, y: 0 }, _this.direction = -1, _this.initialized = false, _this.shouldBlockScrollY = false, _this.shouldBlockScrollX = false, _temp), _possibleConstructorReturn(_this, _ret);
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
    }, {
      key: 'init',
      value: function init(WrappedComponentInstance) {
        if (!WrappedComponentInstance || this.initialized) return;
        this.initialized = true;
        this.wci = WrappedComponentInstance;
        document.addEventListener('scroll', this.handleScroll.bind(this), false);
        this.wci.innerNode.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        this.wci.innerNode.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        this.wci.innerNode.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
        this.wci.innerNode.addEventListener('touchcancel', this.handleTouchEnd.bind(this), false);
      }
    }, {
      key: 'handleTouchStart',
      value: function handleTouchStart(e) {
        this.shouldBlockScrollX = false;
        this.shouldBlockScrollY = false;
        if (this.isStopPropagationAllowed() && this.wci.props.stopPropagation) {
          e.stopPropagation();
        }
        this.initialX = e.touches[0].clientX;
        this.initialY = e.touches[0].clientY;

        this.wci.swipeStart && this.wci.swipeStart(e);
      }
    }, {
      key: 'setDelta',
      value: function setDelta(nextDelta) {
        this.prevDelta = Object.assign({}, this.delta);
        this.delta = nextDelta;
      }
    }, {
      key: 'handleScroll',
      value: function handleScroll() {
        if (!this.shouldBlockScrollY) {
          this.shouldBlockScrollX = true;
        }
      }
    }, {
      key: 'handleTouchMove',
      value: function handleTouchMove(e) {
        if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
          e.stopPropagation();
        }
        var nextDelta = {
          x: this.initialX - e.touches[0].clientX,
          y: this.initialY - e.touches[0].clientY
        };
        this.getDirection(nextDelta);
        switch (this.direction) {
          case DIRECTION_LEFT:
            if (!this.shouldBlockScrollX) {
              this.shouldBlockScrollY = true;
              this.setDelta(nextDelta);
              if (this.wci.swipingLeft && this.isStopPropagationAllowed(IS_STRICT)) {
                this.wci.swipingLeft(e, this.delta);
              }
            }
            break;
          case DIRECTION_RIGHT:
            if (!this.shouldBlockScrollX) {
              this.shouldBlockScrollY = true;
              this.setDelta(nextDelta);
              if (this.wci.swipingRight && this.isStopPropagationAllowed(IS_STRICT)) {
                this.wci.swipingRight(e, this.delta);
              }
            }
            break;
          case DIRECTION_UP:
            this.setDelta(nextDelta);
            if (!this.shouldBlockScrollY) {
              this.shouldBlockScrollX = true;
            }
            this.wci.swipingUp && this.wci.swipingUp(e, this.delta);
            break;
          case DIRECTION_DOWN:
            this.setDelta(nextDelta);
            if (!this.shouldBlockScrollY) {
              this.shouldBlockScrollX = true;
            }
            this.wci.swipingDown && this.wci.swipingDown(e, this.delta);
            break;
          default:
        }
        this.wci.swiping && this.wci.swiping(e, this.delta);

        this.shouldBlockScrollY && e.preventDefault();
      }
    }, {
      key: 'handleTouchEnd',
      value: function handleTouchEnd(e) {
        if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
          e.stopPropagation();
        }

        if (this.delta.x !== 0) {
          this.wci.swiped && this.wci.swiped(e, this.delta);
          if (this.direction === DIRECTION_LEFT) {
            this.wci.swipedLeft && this.wci.swipedLeft(e, this.delta);
          } else if (this.direction === DIRECTION_RIGHT) {
            this.wci.swipedRight && this.wci.swipedRight(e, this.delta);
          }
        }

        this.shouldBlockScrollX = false;
        this.shouldBlockScrollY = false;
        this.prevDelta = { x: 0, y: 0 };
        this.setDelta({ x: 0, y: 0 });
      }
    }, {
      key: 'render',
      value: function render() {
        // eslint-disable-next-line react/jsx-no-bind
        var props = Object.assign({}, this.props, { ref: this.init.bind(this) });
        return _react2.default.createElement(WrappedComponent, props);
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