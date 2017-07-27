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

var _times2 = require('lodash/times');

var _times3 = _interopRequireDefault(_times2);

var _findIndex2 = require('lodash/findIndex');

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _swipeable = require('./swipeable');

var _swipeable2 = _interopRequireDefault(_swipeable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RCarousel = function (_React$Component) {
  _inherits(RCarousel, _React$Component);

  function RCarousel(props) {
    _classCallCheck(this, RCarousel);

    var _this = _possibleConstructorReturn(this, (RCarousel.__proto__ || Object.getPrototypeOf(RCarousel)).call(this, props));

    _this.currentDelta = 0;
    _this.swippingDelta = 0;
    _this.widthTotal = 0;
    _this.checkpoints = [];
    _this.itemWidth = 0;
    _this.itemWidths = [];
    _this.itemNodes = [];
    _this.isToggled = false;
    _this.isLastReached = false;

    _this.handleItemClick = function (e) {
      var i = e.target.dataset.index;
      var _this$props = _this.props,
          loop = _this$props.loop,
          onClick = _this$props.onClick,
          children = _this$props.children;

      var clickedIndex = loop ? i % children.length : i;
      onClick && onClick(clickedIndex, e);
    };

    _this.state = {
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
    _this.renderItem = _this.renderItem.bind(_this);
    return _this;
  }

  _createClass(RCarousel, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _props = this.props,
          onInit = _props.onInit,
          loop = _props.loop,
          children = _props.children;

      var itemsCount = children.length;

      this.innerPadding = parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 0) + parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 0);

      this.calcCheckpoints();
      window.addEventListener('orientationchange', this.handleViewportResize.bind(this));
      window.addEventListener('resize', this.handleViewportResize.bind(this));
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({ rendered: true });

      loop && this.goToSlide(itemsCount - 1, true);

      !loop && onInit && onInit();
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
    value: function componentDidUpdate(prevProps) {
      var _props2 = this.props,
          children = _props2.children,
          currentIndex = _props2.currentIndex,
          loop = _props2.loop,
          onInit = _props2.onInit;

      if (children.length !== prevProps.children.length) {
        this.calcCheckpoints();
        this.goToSlide(currentIndex, true);
      }

      loop && onInit && onInit(); // здесь странно вызывать onInit();
    }
  }, {
    key: 'setStylesWithPrefixes',
    value: function setStylesWithPrefixes(node, delta) {
      var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.3;

      requestAnimationFrame(function () {
        Object.assign(node.style, {
          transform: 'translate3d(' + delta + 'px, 0, 0)',
          transitionDuration: duration + 's'
        });
      });
      this.swippingDelta = delta;
    }
  }, {
    key: 'handleViewportResize',
    value: function handleViewportResize() {
      if (this.innedNode) {
        this.calcCheckpoints();
        this.goToSlide(this.state.currentIndex, true);
      }
    }
  }, {
    key: 'calcCheckpoints',
    value: function calcCheckpoints() {
      var _this2 = this;

      var _props3 = this.props,
          gap = _props3.gap,
          loop = _props3.loop,
          children = _props3.children;


      this.checkpoints = [];
      this.itemWidths = [];
      this.widthTotal = 0;

      (0, _times3.default)(loop ? children.length * 3 : children.length, function (i) {
        var itemNode = _this2.itemNodes[loop ? i % children.length : i];
        if (itemNode) {
          var itemWidth = itemNode.offsetWidth + gap;
          _this2.itemWidth = itemWidth;

          _this2.itemWidths.push(itemWidth);
          _this2.widthTotal += itemWidth;
          _this2.checkpoints.push((itemNode.offsetWidth + gap) / 2 + (itemNode.offsetWidth + gap) * i);
        }
      });
    }
  }, {
    key: 'swipingLeft',
    value: function swipingLeft(e, delta) {
      this.setStylesWithPrefixes(this.innerNode, this.currentDelta - delta.x, 0);
    }
  }, {
    key: 'swipingRight',
    value: function swipingRight(e, delta) {
      this.setStylesWithPrefixes(this.innerNode, this.currentDelta - delta.x, 0);
    }
  }, {
    key: 'swiped',
    value: function swiped(e, _ref) {
      var _this3 = this;

      var deltaX = _ref.x;

      this.isSwiped = true;
      this.isToggled = false;
      var _props4 = this.props,
          disableCheckpoints = _props4.disableCheckpoints,
          loop = _props4.loop,
          children = _props4.children,
          onSwiped = _props4.onSwiped;

      var nextDelta = this.currentDelta - deltaX;
      // иногда не правильно расчитывается
      var maxShift = window.innerWidth - this.widthTotal - this.innerPadding;

      // Фикс на первый слайд
      if (nextDelta > 0) {
        this.currentIndex = 0;
        this.currentDelta = 0;
        this.setStylesWithPrefixes(this.innerNode, 0);
      } else
        // Фикс на последний слайд
        if (nextDelta < maxShift) {
          this.currentIndex = children.length - 1;
          this.currentDelta = Math.min(maxShift, 0);
          this.setStylesWithPrefixes(this.innerNode, this.currentDelta);
        } else
          // Свайп-скролл без фиксов на ближайший слайд
          if (disableCheckpoints) {
            if (loop) {
              var itemsWidthPerScreen = this.widthTotal / 3;
              if (Math.abs(nextDelta) >= itemsWidthPerScreen * 2) {
                this.currentDelta += itemsWidthPerScreen;
              } else if (Math.abs(nextDelta) <= itemsWidthPerScreen) {
                this.currentDelta -= itemsWidthPerScreen;
              }
            }
            this.currentDelta = nextDelta;
            this.setStylesWithPrefixes(this.innerNode, this.currentDelta, 0);
          } else {
            // Фикс на ближайший слайд
            var nextIndex = (0, _findIndex3.default)(this.checkpoints, function (checkpoint, i) {
              return Math.abs(nextDelta) > checkpoint && Math.abs(nextDelta) < _this3.checkpoints[i + 1];
            }) + (loop ? 0 : 1);
            this.isToggled = nextIndex !== this.state.currentIndex;
            this.goToSlide(nextIndex);
          }
      onSwiped && onSwiped(this.currentIndex);
    }
  }, {
    key: 'handleTransitionEnd',
    value: function handleTransitionEnd() {
      var _props5 = this.props,
          onSwiped = _props5.onSwiped,
          loop = _props5.loop,
          children = _props5.children;

      if (!this.isToggled || !this.isSwiped) {
        return false;
      }
      if (loop) {
        var min = this.itemNodes.length / 3;
        var max = this.itemNodes.length - children.length - 1;
        if (this.state.currentIndex < min - 1) {
          // достигли первого слайда, показали последний
          this.goToSlide(max - 1, true);
        } else if (this.state.currentIndex >= max) {
          // достигли последнего слайда, показали первый
          this.goToSlide(min - 1, true);
        }
      }
    }
  }, {
    key: 'handlePaginationClick',
    value: function handlePaginationClick(e) {
      e.stopPropagation();
      var idx = parseInt(e.target.dataset.idx, 0);
      this.goToSlide(idx + 4);
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
    key: 'goToSlide',
    value: function goToSlide(nextIndex, withoutAnimation) {
      if (!this.innerNode) return;
      var _props6 = this.props,
          transitionDuration = _props6.transitionDuration,
          loop = _props6.loop,
          gap = _props6.gap,
          children = _props6.children;

      var lastIndexDelta = this.innerNode.offsetWidth - this.widthTotal - this.innerPadding + gap;
      this.currentIndex = nextIndex;
      if (!loop && this.widthTotal + this.innerPadding < window.innerWidth) {
        this.currentDelta = 0;
      } else if (!loop && nextIndex === children.length - 1) {
        this.isLastReached = true;
        this.currentDelta = lastIndexDelta;
      } else if (!loop && nextIndex === 0) {
        this.currentDelta = 0;
        this.isLastReached = false;
      } else {
        var nextDelta = -this.itemWidths.slice(0, loop ? nextIndex + 1 : nextIndex).reduce(function (a, b) {
          return a + b;
        }, 0);
        if (nextDelta <= lastIndexDelta) {
          this.isLastReached = true;
          this.currentDelta = lastIndexDelta;
        } else {
          this.isLastReached = false;
          this.currentDelta = nextDelta;
        }
      }

      this.setStylesWithPrefixes(this.innerNode, this.currentDelta, withoutAnimation ? 0 : transitionDuration);
      this.setState({
        currentIndex: nextIndex,
        realIndex: (nextIndex + 1) % children.length
      });
    }
  }, {
    key: 'isItemActive',
    value: function isItemActive(i) {
      var loop = this.props.loop;

      if (!this.state.rendered) return false;
      return loop ? i % (this.state.currentIndex + 1) === 0 : this.state.currentIndex === i;
    }
  }, {
    key: 'renderItem',
    value: function renderItem(item, i) {
      var _this4 = this;

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
            return _this4.itemNodes[i] = node;
          },
          style: { marginLeft: gap },
          onClick: this.handleItemClick
        },
        item
      );
    }
  }, {
    key: 'renderLoopItems',
    value: function renderLoopItems() {
      var _this5 = this;

      var children = this.props.children;

      var itemsCount = children.length;
      var items = [];
      (0, _times3.default)(itemsCount * 3, function (i) {
        items.push(_this5.renderItem(children[i % itemsCount], i));
      });
      return items;
    }
  }, {
    key: 'renderItems',
    value: function renderItems() {
      return this.props.children.map(this.renderItem);
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
    key: 'render',
    value: function render() {
      var _this6 = this;

      var _props8 = this.props,
          classNames = _props8.classNames,
          loop = _props8.loop;


      return _react2.default.createElement(
        'div',
        {
          className: (0, _classnames2.default)(classNames.root),
          ref: function ref(node) {
            return _this6.rootNode = node;
          }
        },
        _react2.default.createElement(
          'div',
          {
            className: (0, _classnames2.default)(classNames.inner),
            ref: function ref(node) {
              return _this6.innerNode = node;
            },
            onTransitionEnd: this.handleTransitionEnd
          },
          loop ? this.renderLoopItems() : this.renderItems()
        ),
        this.props.prevNext && this.renderPrevNext(),
        this.props.pagination && _react2.default.createElement(
          'div',
          {
            className: (0, _classnames2.default)(classNames.pagination)
          },
          this.props.children.map(function (item, i) {
            return _react2.default.createElement('button', {
              key: item.key,
              'data-idx': i,
              className: (0, _classnames2.default)(classNames.paginationItem, _defineProperty({}, classNames.paginationItemActive, loop ? i === (_this6.state.currentIndex + 1) % 5 : i === _this6.state.currentIndex)),
              onClick: _this6.handlePaginationClick
            });
          })
        )
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
  currentIndex: -1,
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