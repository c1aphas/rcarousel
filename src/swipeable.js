import React from 'react';
import isSupportsPassive from './supports-passive';

const DIRECTION_LEFT = 0;
const DIRECTION_RIGHT = 1;
const DIRECTION_UP = 2;
const DIRECTION_DOWN = 3;
const IS_STRICT = true;

export default function(WrappedComponent) {
  return class Swipeable extends React.PureComponent {
    initialX = 0
    initialY = 0
    delta = {x: 0, y: 0}
    prevDelta = {x: 0, y: 0}
    direction = -1
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

    // https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77
    setIosHack() {
      if (!window.iosPreventDefaultScroll) {
        window.addEventListener('touchmove', () => {});
        window.iosPreventDefaultScroll = 1;
      }
    }

    componentDidMount() {
      this.wci.innerNode.addEventListener('touchstart', this.handleTouchStart, isSupportsPassive ? {passive: true} : false);
      this.wci.innerNode.addEventListener('touchmove', this.handleTouchMove, false);
      this.wci.innerNode.addEventListener('touchend', this.handleTouchEnd, isSupportsPassive ? {passive: true} : false);
      this.wci.innerNode.addEventListener('touchcancel', this.handleTouchEnd, isSupportsPassive ? {passive: true} : false);
      this.setIosHack();
    }

    componentWillUnmount() {
      this.wci.innerNode.removeEventListener('touchstart', this.handleTouchStart);
      this.wci.innerNode.removeEventListener('touchmove', this.handleTouchMove);
      this.wci.innerNode.removeEventListener('touchend', this.handleTouchEnd);
      this.wci.innerNode.removeEventListener('touchcancel', this.handleTouchEnd);
    }

    handleTouchStart = (e) => {
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

    handleTouchMove = (e) => {
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

    handleTouchEnd = (e) => {
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

      this.shouldBlockScrollX = false;
      this.shouldBlockScrollY = false;
      this.setDelta({x: 0, y: 0});
      this.prevDelta = {x: 0, y: 0};
    }

    render() {
      return <WrappedComponent {...this.props} ref={node => this.wci = node} />;
    }
  };
}
