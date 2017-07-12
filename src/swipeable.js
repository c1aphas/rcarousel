import React, {Component} from 'react';

const DIRECTION_LEFT = 0;
const DIRECTION_RIGHT = 1;
const DIRECTION_UP = 2;
const DIRECTION_DOWN = 3;
const IS_STRICT = true;

export default function(WrappedComponent) {
  return class Swipeable extends Component {
    initialX = 0
    initialY = 0
    delta = {x: 0, y: 0}
    prevDelta = {x: 0, y: 0}
    direction = -1
    initialized = false
    shouldBlockScrollY = false
    shouldBlockScrollX = false
    isMoving = false

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

    init(WrappedComponentInstance) {
      if (!WrappedComponentInstance || this.initialized) return;
      this.initialized = true;
      this.wci = WrappedComponentInstance;
      document.addEventListener('scroll', this.handleScroll.bind(this), false);
      this.wci.innerNode.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
      this.wci.innerNode.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
      this.wci.innerNode.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
      this.wci.innerNode.addEventListener('touchcancel', this.handleTouchEnd.bind(this), false);
    }

    handleTouchStart(e) {
      this.shouldBlockScrollX = false;
      this.shouldBlockScrollY = false;
      if (this.isStopPropagationAllowed() && this.wci.props.stopPropagation) {
        e.stopPropagation();
      }
      this.initialX = e.touches[0].clientX;
      this.initialY = e.touches[0].clientY;
      this.isMoving = false;

      this.wci.swipeStart && this.wci.swipeStart(e);
    }

    setDelta(nextDelta) {
      this.prevDelta = Object.assign({}, this.delta);
      this.delta = nextDelta;
    }

    handleScroll() {
      if (!this.shouldBlockScrollY) {
        this.shouldBlockScrollX = true;
      }
    }

    handleTouchMove(e) {
      if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
        e.stopPropagation();
      }
      const nextDelta = {
        x: this.initialX - e.touches[0].clientX,
        y: this.initialY - e.touches[0].clientY,
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
      this.isMoving = true;
      this.wci.swiping && this.wci.swiping(e, this.delta);

      this.shouldBlockScrollY && e.preventDefault();
    }

    handleTouchEnd(e) {
      if (this.isStopPropagationAllowed(IS_STRICT) && this.wci.props.stopPropagation) {
        e.stopPropagation();
      }
      if (this.isMoving) {
        e.cancelable && e.preventDefault();
        this.wci.swiped && this.wci.swiped(e, this.delta);
        if (this.direction === DIRECTION_LEFT) {
          this.wci.swipedLeft && this.wci.swipedLeft(e, this.delta);
        } else if (this.direction === DIRECTION_RIGHT) {
          this.wci.swipedRight && this.wci.swipedRight(e, this.delta);
        }
      }
      this.shouldBlockScrollX = false;
      this.shouldBlockScrollY = false;
      this.prevDelta = {x: 0, y: 0};
      this.isMoving = false;
    }

    render() {
      // eslint-disable-next-line react/jsx-no-bind
      const props = Object.assign({}, this.props, {ref: this.init.bind(this)});
      return <WrappedComponent {...props} />;
    }
  };
}
