import React from 'react';

const DIRECTION_LEFT = 0;
const DIRECTION_RIGHT = 1;
const DIRECTION_UP = 2;
const DIRECTION_DOWN = 3;
const IS_STRICT = true;

const DIRS = {
  [DIRECTION_LEFT]:  'LEFT',
  [DIRECTION_RIGHT]: 'RIGHT',
  [DIRECTION_UP]:    'UP',
  [DIRECTION_DOWN]:  'DOWN',
}

export default function(WrappedComponent) {
  return class Swipeable extends React.PureComponent {
    constructor(props) {
      super(props);
      this.handleScroll = this.handleScroll.bind(this);
      this.handleTouchStart = this.handleTouchStart.bind(this);
      this.handleTouchMove = this.handleTouchMove.bind(this);
      this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    initialX = 0
    initialY = 0
    delta = {x: 0, y: 0}
    prevDelta = {x: 0, y: 0}
    direction = -1
    initialized = false
    shouldBlockScrollY = false
    shouldBlockScrollX = false

    getDirection(nextDelta) {
      const deltaX = Math.abs(nextDelta.x - this.prevDelta.x);
      const deltaY = Math.abs(nextDelta.y - this.prevDelta.y);
      const isHorizontal = deltaX > deltaY;

      if (isHorizontal) {
        this.direction = nextDelta.x > this.prevDelta.x
          ? DIRECTION_LEFT
          : DIRECTION_RIGHT;
      } else {
        this.direction = nextDelta.y > this.prevDelta.y
          ? DIRECTION_UP
          : DIRECTION_DOWN;
      }
    }

    isStopPropagationAllowed(isStrict) {
      const isFirst = this.wci.currentIndex === 0;
      const isSwippingFirst = isStrict ? this.wci.swippingDelta > 0 : this.wci.swippingDelta >= 0;
      const isLast = this.wci.currentIndex === this.wci.props.children.length - 1;
      const isSwippingLast = isStrict
        ? -this.wci.swippingDelta > this.wci.widthTotal - this.wci.itemWidth
        : -this.wci.swippingDelta >= this.wci.widthTotal - this.wci.itemWidth;
      const isSwippingInner = (isFirst && isSwippingFirst) || (isLast && isSwippingLast);
      return !this.wci.props.isRelatedInnerSlider || !isSwippingInner;
    }

    // init(WrappedComponentInstance) {
    //   if (!WrappedComponentInstance || this.initialized) return;
    //   this.initialized = true;
    //   this.wci = WrappedComponentInstance;
    //   document.addEventListener('scroll', this.handleScroll.bind(this), false);
    //   this.wci.innerNode.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
    //   this.wci.innerNode.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
    //   this.wci.innerNode.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
    //   this.wci.innerNode.addEventListener('touchcancel', this.handleTouchEnd.bind(this), false);
    // }

    componentDidMount() {
      console.log('componentDidMount');
      document.addEventListener('scroll', this.handleScroll, false);
      this.wci.innerNode.addEventListener('touchstart', this.handleTouchStart, false);
      this.wci.innerNode.addEventListener('touchmove', this.handleTouchMove, false);
      this.wci.innerNode.addEventListener('touchend', this.handleTouchEnd, false);
      this.wci.innerNode.addEventListener('touchcancel', this.handleTouchEnd, false);
    }

    componentWillUnmount() {
      console.log('componentWillUnmount');
      document.removeEventListener('scroll', this.handleScroll);
      this.wci.innerNode.removeEventListener('touchstart', this.handleTouchStart);
      this.wci.innerNode.removeEventListener('touchmove', this.handleTouchMove);
      this.wci.innerNode.removeEventListener('touchend', this.handleTouchEnd);
      this.wci.innerNode.removeEventListener('touchcancel', this.handleTouchEnd);
    }

    handleTouchStart(e) {
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
    }

    setDelta(nextDelta) {
      this.prevDelta = Object.assign({}, this.delta);
      this.delta = nextDelta;
    }

    handleScroll(e) {
      //console.log(`SCROLL blockX ${this.shouldBlockScrollX} blockY ${this.shouldBlockScrollY}`);
      if (!this.shouldBlockScrollY) {
        this.shouldBlockScrollX = true;
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    handleTouchMove(e) {
      if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
        e.stopPropagation();
      }
      if (!e.targetTouches.length) {
        return;
      }
      const nextDelta = {
        x: this.initialX - e.targetTouches[0].clientX,
        y: this.initialY - e.targetTouches[0].clientY,
      };
      this.getDirection(nextDelta);
      //console.log(`direction ${DIRS[this.direction]} blockX ${this.shouldBlockScrollX} blockY ${this.shouldBlockScrollY}`);
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

    handleTouchEnd(e) {
      if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
        e.stopPropagation();
      }

      this.delta = {
        x: this.shouldBlockScrollX ? 0 : this.delta.x,
        y: this.shouldBlockScrollY ? 0 : this.delta.y,
      };

      if (this.delta.x !== 0) {
        this.wci.swiped && this.wci.swiped(e, this.delta);
      }

      // if (this.delta.x !== 0) {
      //   this.wci.swiped && this.wci.swiped(e, this.delta);
      //   if (this.direction === DIRECTION_LEFT) {
      //     this.wci.swipedLeft && this.wci.swipedLeft(e, this.delta);
      //   } else if (this.direction === DIRECTION_RIGHT) {
      //     this.wci.swipedRight && this.wci.swipedRight(e, this.delta);
      //   }
      // }

      this.shouldBlockScrollX = false;
      this.shouldBlockScrollY = false;
      this.setDelta({x: 0, y: 0});
      this.prevDelta = {x: 0, y: 0};
    }

    render() {
      // // eslint-disable-next-line react/jsx-no-bind
      // const props = Object.assign({}, this.props, {ref: this.init.bind(this)});
      // return <WrappedComponent {...props} />;
      return <WrappedComponent {...this.props} ref={node => this.wci = node} />;
    }
  };
}
