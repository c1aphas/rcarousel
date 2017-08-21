'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var pt = _interopRequireWildcard(_propTypes);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _swipeable = require('./swipeable');

var _swipeable2 = _interopRequireDefault(_swipeable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SCREEN_FACTOR = 3;

var RCarousel = function (_React$Component) {
  _inherits(RCarousel, _React$Component);

  function RCarousel(props) {
    _classCallCheck(this, RCarousel);

    var _this = _possibleConstructorReturn(this, (RCarousel.__proto__ || Object.getPrototypeOf(RCarousel)).call(this, props));

    _this.handleViewportResize = function () {
      _this.calcBasicValues();
      if (_this.props.loop) {
        _this.setState({ rend: _this.repeatsOnScreen * SCREEN_FACTOR });
      }
      _this.goToSlide(_this.state.currentIndex, true);
    };

    _this.currentDelta = 0;
    _this.swippingDelta = 0;
    _this.widthTotal = 0;
    _this.checkpoints = [];
    _this.itemWidth = 0;
    _this.itemWidths = [];
    _this.itemNodes = [];
    _this.isToggled = false;
    _this.isLastReached = false;

    _this.handleItemClick = function (i, e) {
      var _this$props = _this.props,
          onClick = _this$props.onClick,
          children = _this$props.children;

      var index = i % children.length;
      onClick && onClick(index, e);
    };

    _this.state = {
      rend: 1,
      realIndex: 0,
      currentIndex: 0,
      isClonesRendered: false,
      rendered: false
    };

    _this.handleTransitionEnd = _this.handleTransitionEnd.bind(_this);
    _this.handlePaginationClick = _this.handlePaginationClick.bind(_this);
    _this.handleItemClick = _this.handleItemClick.bind(_this);
    _this.handlePrevClick = _this.handlePrevClick.bind(_this);
    _this.handleNextClick = _this.handleNextClick.bind(_this);
    return _this;
  }

  _createClass(RCarousel, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _props = this.props,
          onInit = _props.onInit,
          loop = _props.loop,
          currentIndex = _props.currentIndex;


      this.innerPadding = parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 10) + parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 10);
      window.addEventListener('orientationchange', this.handleViewportResize);
      window.addEventListener('resize', this.handleViewportResize);

      this.calcBasicValues();
      if (loop) {
        this.setState({ rend: this.repeatsOnScreen * SCREEN_FACTOR });
        this.goToSlide(this.itemsOnScreen + currentIndex, true);
      } else {
        this.goToSlide(currentIndex, true);
      }

      this.setState({ rendered: true });
      onInit && onInit();
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps) {
      if (this.props.currentIndex !== nextProps.currentIndex) {
        this.goToSlide(nextProps.currentIndex);
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      var _props2 = this.props,
          children = _props2.children,
          currentIndex = _props2.currentIndex,
          loop = _props2.loop,
          onInit = _props2.onInit;

      if (children.length !== prevProps.children.length || this.state.rend !== prevState.rend) {
        this.calcBasicValues();
        this.goToSlide(loop ? this.itemsOnScreen + currentIndex : currentIndex, true);
      }

      loop && onInit && onInit();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('orientationchange', this.handleViewportResize);
      window.removeEventListener('resize', this.handleViewportResize);
    }
  }, {
    key: 'setStylesWithPrefixes',
    value: function setStylesWithPrefixes(delta) {
      var _this2 = this;

      var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.3;

      requestAnimationFrame(function () {
        Object.assign(_this2.innerNode.style, {
          transform: 'translate3d(' + delta + 'px, 0, 0)',
          transitionDuration: duration + 's'
        });
      });
    }
  }, {
    key: 'getRepeatOnScreen',
    value: function getRepeatOnScreen(childrenWidth) {
      return this.innerNode === null ? 1 : Math.ceil(this.innerNode.offsetWidth / childrenWidth);
    }
  }, {
    key: 'getItemWidths',
    value: function getItemWidths() {
      var itemWidths = [];
      for (var i = 0; i < this.props.children.length; i++) {
        if (this.itemNodes[i]) {
          itemWidths.push(this.itemNodes[i].offsetWidth + this.props.gap);
        }
      }
      return itemWidths;
    }
  }, {
    key: 'getChildrenWidth',
    value: function getChildrenWidth(itemWidths) {
      var total = 0;
      for (var i = 0; i < itemWidths.length; i++) {
        total += itemWidths[i];
      }
      return total;
    }
  }, {
    key: 'getCheckpoints',
    value: function getCheckpoints(itemWidths) {
      var sum = 0;
      var checkpoints = [];
      for (var i = 0; i < itemWidths.length * this.state.rend; i++) {
        checkpoints.push(itemWidths[i % itemWidths.length] / 2 + sum);
        sum += itemWidths[i % itemWidths.length];
      }
      return checkpoints;
    }
  }, {
    key: 'calcBasicValues',
    value: function calcBasicValues() {
      this.itemWidths = this.getItemWidths();
      this.childrenWidth = this.getChildrenWidth(this.itemWidths);
      this.widthTotal = this.childrenWidth * this.state.rend;
      if (!this.props.disableCheckpoints) {
        this.checkpoints = this.getCheckpoints(this.itemWidths);
      }
      if (this.props.loop) {
        this.repeatsOnScreen = this.getRepeatOnScreen(this.childrenWidth);
        this.itemsOnScreen = this.repeatsOnScreen * this.props.children.length;
      }
    }
  }, {
    key: 'swipingLeft',
    value: function swipingLeft(e, delta) {
      this.swippingDelta = this.currentDelta - delta.x;
      this.setStylesWithPrefixes(this.swippingDelta, 0);
    }
  }, {
    key: 'swipingRight',
    value: function swipingRight(e, delta) {
      this.swippingDelta = this.currentDelta - delta.x;
      this.setStylesWithPrefixes(this.swippingDelta, 0);
    }
  }, {
    key: 'swiped',
    value: function swiped(e, _ref) {
      var deltaX = _ref.x;

      this.isToggled = false;
      var _props3 = this.props,
          disableCheckpoints = _props3.disableCheckpoints,
          gap = _props3.gap,
          onSwiped = _props3.onSwiped,
          transitionDuration = _props3.transitionDuration;

      var nextDelta = this.currentDelta - deltaX;
      var lastIndexDelta = this.innerNode.offsetWidth - this.widthTotal - this.innerPadding + gap;

      if (disableCheckpoints) {
        if (nextDelta > 0) {
          this.currentDelta = 0;
        } else if (nextDelta <= lastIndexDelta) {
          this.currentDelta = Math.min(lastIndexDelta, 0);
        } else {
          this.currentDelta = nextDelta;
        }
        this.setStylesWithPrefixes(this.currentDelta, transitionDuration);
      } else {
        var nextIndex = this.findSlideIndex(nextDelta);
        this.isToggled = nextIndex !== this.state.currentIndex;
        this.goToSlide(nextIndex);
      }
      onSwiped && onSwiped(this.currentIndex);
    }
  }, {
    key: 'findSlideIndex',
    value: function findSlideIndex(delta) {
      var absDelta = Math.abs(delta);
      if (delta > 0 || absDelta < this.checkpoints[0]) {
        return 0;
      }
      if (absDelta > this.checkpoints[this.checkpoints.length - 1]) {
        return this.checkpoints.length - 1;
      }
      for (var i = 0; i < this.checkpoints.length - 1; i++) {
        if (absDelta >= this.checkpoints[i] && absDelta < this.checkpoints[i + 1]) {
          return i + 1;
        }
      }
      return -1;
    }
  }, {
    key: 'handleTransitionEnd',
    value: function handleTransitionEnd() {
      var _props4 = this.props,
          loop = _props4.loop,
          disableCheckpoints = _props4.disableCheckpoints;


      if (loop) {
        if (disableCheckpoints) {
          if (Math.abs(this.currentDelta) >= this.childrenWidth * 2) {
            this.currentDelta += this.childrenWidth;
          } else if (Math.abs(this.currentDelta) <= this.childrenWidth) {
            this.currentDelta -= this.childrenWidth;
          }
          this.setStylesWithPrefixes(this.currentDelta, 0);
        } else if (this.state.currentIndex < this.itemsOnScreen) {
          this.goToSlide(this.state.currentIndex + this.itemsOnScreen, true);
        } else if (this.state.currentIndex >= this.itemsOnScreen * 2) {
          this.goToSlide(this.state.currentIndex - this.itemsOnScreen, true);
        }
      }
    }
  }, {
    key: 'goToSlide',
    value: function goToSlide(nextIndex, withoutAnimation) {
      if (nextIndex < 0 || nextIndex >= this.itemNodes.length || this.innerNode === null) return;

      var _props5 = this.props,
          transitionDuration = _props5.transitionDuration,
          loop = _props5.loop,
          gap = _props5.gap,
          children = _props5.children;

      var lastIndexDelta = this.innerNode.offsetWidth - this.widthTotal - this.innerPadding + gap;

      var nextDelta = 0;
      for (var i = 0; i < nextIndex; i++) {
        nextDelta -= this.itemWidths[i % children.length];
      }

      if (!loop && nextDelta <= lastIndexDelta) {
        // фикс для последнего слайда
        this.currentDelta = Math.min(lastIndexDelta, 0);
      } else {
        this.currentDelta = nextDelta;
      }

      this.isLastReached = nextDelta <= lastIndexDelta;
      this.currentIndex = nextIndex;

      this.setStylesWithPrefixes(this.currentDelta, withoutAnimation ? 0 : transitionDuration);
      this.setState({
        currentIndex: nextIndex,
        realIndex: nextIndex % children.length
      });
    }
  }, {
    key: 'handlePaginationClick',
    value: function handlePaginationClick(e) {
      e.stopPropagation();
      var _props6 = this.props,
          loop = _props6.loop,
          children = _props6.children;

      var idx = parseInt(e.target.dataset.idx, 10);
      this.goToSlide(loop ? idx + children.length : idx);
    }
  }, {
    key: 'togglePrevNext',
    value: function togglePrevNext(index) {
      var onSwiped = this.props.onSwiped;

      this.goToSlide(index);
      onSwiped && onSwiped(this.currentIndex, this.isLastReached);
    }
  }, {
    key: 'handlePrevClick',
    value: function handlePrevClick() {
      var currentIndex = this.state.currentIndex;

      currentIndex !== 0 && this.togglePrevNext(currentIndex - 1);
    }
  }, {
    key: 'handleNextClick',
    value: function handleNextClick() {
      var currentIndex = this.state.currentIndex;

      !this.isLastReached && this.togglePrevNext(currentIndex + 1);
    }
  }, {
    key: 'isItemActive',
    value: function isItemActive(i) {
      var len = this.props.children.length;
      return this.state.currentIndex % len === i % len;
    }
  }, {
    key: 'renderItem',
    value: function renderItem(item, i) {
      var _this3 = this;

      var _props7 = this.props,
          classNames = _props7.classNames,
          gap = _props7.gap;

      return _react2.default.createElement(
        'div',
        {
          key: i,
          'data-index': i,
          className: (0, _classnames2.default)(classNames.item, _defineProperty({}, classNames.itemActive, this.isItemActive(i))),
          ref: function ref(node) {
            return _this3.itemNodes[i] = node;
          },
          style: { marginLeft: gap },
          onClick: function onClick(e) {
            return _this3.handleItemClick(i, e);
          }
        },
        item
      );
    }
  }, {
    key: 'renderItems',
    value: function renderItems() {
      var children = this.props.children;

      var items = [];
      for (var i = 0; i < children.length * this.state.rend; i++) {
        items.push(this.renderItem(children[i % children.length], i));
      }
      return items;
    }
  }, {
    key: 'renderPrevNext',
    value: function renderPrevNext() {
      var classNames = this.props.classNames;

      return [_react2.default.createElement('button', {
        className: (0, _classnames2.default)(classNames.buttonPrev),
        style: this.state.currentIndex === 0 ? { display: 'none' } : null,
        onClick: this.handlePrevClick,
        key: 'carousel-button-prev'
      }), _react2.default.createElement('button', {
        className: (0, _classnames2.default)(classNames.buttonNext),
        style: this.isLastReached ? { display: 'none' } : null,
        onClick: this.handleNextClick,
        key: 'carousel-button-next'
      })];
    }
  }, {
    key: 'renderPagination',
    value: function renderPagination() {
      var _this4 = this;

      var classNames = this.props.classNames;


      return _react2.default.createElement(
        'div',
        {
          className: (0, _classnames2.default)(classNames.pagination)
        },
        this.props.children.map(function (item, i) {
          return _react2.default.createElement('button', {
            key: item.key || i,
            'data-idx': i,
            className: (0, _classnames2.default)(classNames.paginationItem, _defineProperty({}, classNames.paginationItemActive, _this4.isItemActive(i))),
            onClick: _this4.handlePaginationClick
          });
        })
      );
    }
  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      var classNames = this.props.classNames;


      return _react2.default.createElement(
        'div',
        {
          className: (0, _classnames2.default)(classNames.root)
        },
        _react2.default.createElement(
          'div',
          {
            className: (0, _classnames2.default)(classNames.inner),
            ref: function ref(node) {
              return _this5.innerNode = node;
            },
            onTransitionEnd: this.handleTransitionEnd
          },
          this.renderItems()
        ),
        this.props.prevNext && this.renderPrevNext(),
        this.props.pagination && this.renderPagination()
      );
    }
  }]);

  return RCarousel;
}(_react2.default.Component);

RCarousel.defaultProps = {
  gap: 0,
  transitionDuration: 0.2,
  classNames: {
    root: '',
    inner: '',
    item: '',
    itemActive: '',
    pagination: '',
    paginationItem: '',
    paginationItemActive: '',
    prevNext: '',
    buttonNext: '',
    buttonPrev: ''
  },
  pagination: false,
  prevNext: false,
  stopPropagation: false,
  loop: false,
  onSlideChange: function onSlideChange() {}, // Нигде не используется
  onInit: function onInit() {},
  onSwiped: function onSwiped() {},
  onClick: function onClick() {},
  currentIndex: 0,
  disableCheckpoints: false,
  isRelatedInnerSlider: false
};

RCarousel.propTypes = {
  gap: pt.number,
  transitionDuration: pt.number,
  classNames: pt.shape({
    root: pt.string,
    inner: pt.string,
    item: pt.string,
    itemActive: pt.string,
    pagination: pt.string,
    paginationItem: pt.string,
    paginationItemActive: pt.string,
    prevNext: pt.string,
    buttonNext: pt.string,
    buttonPrev: pt.string
  }),
  loop: pt.bool,
  pagination: pt.bool,
  prevNext: pt.bool,
  disableCheckpoints: pt.bool,
  children: pt.arrayOf(pt.node).isRequired,
  onInit: pt.func,
  onSwiped: pt.func,
  onClick: pt.func,
  currentIndex: pt.number
};

exports.default = (0, _swipeable2.default)(RCarousel);
module.exports = exports['default'];