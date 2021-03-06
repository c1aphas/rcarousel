import React from 'react';
import * as pt from 'prop-types';
import cn from 'classnames';
import swipeable from './swipeable';

const SCREEN_FACTOR = 3;

class RCarousel extends React.PureComponent {
  state = {
    clonesCount:  1,
    realIndex:    0,
    currentIndex: 0,
    rendered:     false,
  };

  componentDidMount() {
    const {onInit, loop, currentIndex} = this.props;

    this.innerPadding =
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 10) +
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 10);
    window.addEventListener('orientationchange', this.handleViewportResize);
    window.addEventListener('resize', this.handleViewportResize);

    this.calcBasicValues();
    if (loop) {
      this.setState({clonesCount: this.repeatsOnScreen * SCREEN_FACTOR});
      this.goToSlide(this.itemsOnScreen + currentIndex, true);
    } else {
      this.goToSlide(currentIndex, true);
    }

    this.setState({rendered: true});
    onInit && onInit();
  }

  componentWillUpdate(nextProps) {
    if (this.props.currentIndex !== nextProps.currentIndex) {
      this.goToSlide(nextProps.currentIndex);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {children, currentIndex, loop, onInit} = this.props;
    const isChildrenCountChanged = children.length !== prevProps.children.length;
    const isClonesCountChanged = this.state.clonesCount !== prevState.clonesCount;

    if (isChildrenCountChanged || isClonesCountChanged) {
      this.calcBasicValues();
      this.goToSlide(loop ? this.itemsOnScreen + currentIndex : currentIndex, true);
      loop && onInit && onInit();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('orientationchange', this.handleViewportResize);
    window.removeEventListener('resize', this.handleViewportResize);
  }

  setStylesWithPrefixes(delta, duration = 0.3) {
    requestAnimationFrame(() => {
      if (!this.innerNode) {
        return;
      }

      Object.assign(this.innerNode.style, {
        transform:          `translate3d(${delta}px, 0, 0)`,
        transitionDuration: `${duration}s`,
      });
    });
  }

  getRepeatOnScreen(childrenWidth) {
    return this.innerNode === null ? 1 : Math.ceil(this.innerNode.offsetWidth / childrenWidth);
  }

  getItemWidths() {
    let offset = 0;
    const itemWidths = [];
    for (let i = 0; i < this.props.children.length; i++) {
      if (this.itemNodes[i]) {
        const width = this.itemNodes[i].offsetWidth + this.props.gap;
        itemWidths.push({width, offset});
        offset -= width;
      }
    }
    return itemWidths;
  }

  getChildrenWidth(itemWidths) {
    let total = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      total += itemWidths[i].width;
    }
    return total;
  }

  getCheckpoints(itemWidths) {
    const {checkpointThreshold} = this.props;
    let sum = 0;
    const checkpoints = [];

    for (let i = 0; i < itemWidths.length * this.state.clonesCount; i++) {
      const width = itemWidths[i % itemWidths.length].width;
      checkpoints.push((width / checkpointThreshold) + sum);
      sum += width;
    }
    return checkpoints;
  }

  getDeltaInBounds(delta) {
    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding)
      + this.props.gap;
    if (delta > 0) return 0;
    if (delta < lastIndexDelta) return Math.min(lastIndexDelta, 0);
    return delta;
  }

  getPrevIndex() {
    const {loop} = this.props;
    if (!loop && this.currentIndex === 0) {
      return this.currentIndex;
    }
    return this.currentIndex - 1;
  }

  getNextIndex() {
    const {loop, children} = this.props;

    if (!loop && this.currentIndex === children.length - 1) {
      return this.currentIndex;
    }

    return this.currentIndex + 1;
  }

  calcBasicValues() {
    this.itemWidths = this.getItemWidths();
    this.childrenWidth = this.getChildrenWidth(this.itemWidths);
    this.widthTotal = this.childrenWidth * this.state.clonesCount;
    if (!this.props.disableCheckpoints) {
      this.checkpoints = this.getCheckpoints(this.itemWidths);
    }
    if (this.props.loop) {
      this.repeatsOnScreen = this.getRepeatOnScreen(this.childrenWidth);
      this.itemsOnScreen = this.repeatsOnScreen * this.props.children.length;
    }
  }

  handleViewportResize = () => {
    this.calcBasicValues();
    if (this.props.loop) {
      this.setState({clonesCount: this.repeatsOnScreen * SCREEN_FACTOR});
    }
    this.goToSlide(this.state.currentIndex, true);
  }

  currentDelta = 0;
  swippingDelta = 0;
  widthTotal = 0;
  checkpoints = [];
  itemWidth = 0;
  itemWidths = [];
  itemNodes = [];
  isToggled = false;
  isLastReached = false;

  swipingLeft(e, delta) {
    this.swippingDelta = this.currentDelta - delta.x;
    this.setStylesWithPrefixes(this.swippingDelta, 0);
  }

  swipingRight(e, delta) {
    this.swippingDelta = this.currentDelta - delta.x;
    this.setStylesWithPrefixes(this.swippingDelta, 0);
  }

  swiped(e, {x: deltaX}, isFastAction) {
    this.isToggled = false;
    const {disableCheckpoints, onSwiped, transitionDuration} = this.props;
    const nextDelta = this.currentDelta - deltaX;

    if (disableCheckpoints) {
      this.currentDelta = this.getDeltaInBounds(nextDelta);
      this.setStylesWithPrefixes(this.currentDelta, transitionDuration);
      onSwiped && onSwiped(this.state.realIndex);
    } else {
      let nextIndex;
      if (isFastAction) {
        nextIndex = deltaX > 0 ? this.getNextIndex() : this.getPrevIndex();
      } else {
        nextIndex = this.findSlideIndexByCheckpoints(nextDelta);
      }
      this.isToggled = nextIndex !== this.state.currentIndex;
      this.goToSlide(nextIndex, false, () => {
        onSwiped && onSwiped(this.state.realIndex);
      });
    }
  }

  findSlideIndexByCheckpoints(delta) {
    const absDelta = Math.abs(delta);
    if (delta > 0 || absDelta < this.checkpoints[0]) {
      return 0;
    }
    if (absDelta > this.checkpoints[this.checkpoints.length - 1]) {
      return this.checkpoints.length - 1;
    }

    for (let i = 0; i < this.checkpoints.length - 1; i++) {
      if (absDelta >= this.checkpoints[i] && absDelta < this.checkpoints[i + 1]) {
        return i + 1;
      }
    }
    return -1;
  }

  handleTransitionEnd = () => {
    const {loop, disableCheckpoints} = this.props;

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

  goToSlide(nextIndex, withoutAnimation, cb) {
    if (nextIndex < 0 || nextIndex >= this.itemNodes.length || this.innerNode === null) return;

    const {transitionDuration, gap, center, children} = this.props;
    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding) + gap;
    const item = this.itemWidths[nextIndex % children.length];

    let nextDelta = (-Math.floor(nextIndex / children.length) * this.childrenWidth) + item.offset;

    if (center) {
      nextDelta += ((this.innerNode.offsetWidth - item.width) + gap) / 2;
    }

    this.currentDelta = this.getDeltaInBounds(nextDelta);
    this.isLastReached = nextDelta <= lastIndexDelta;
    this.currentIndex = nextIndex;

    this.setStylesWithPrefixes(
      this.currentDelta,
      withoutAnimation ? 0 : transitionDuration
    );
    this.setState({
      currentIndex: nextIndex,
      realIndex:    nextIndex % children.length,
    }, cb);
  }

  handlePaginationClick = (e) => {
    e.stopPropagation();
    const {loop, children} = this.props;
    const idx = parseInt(e.target.dataset.idx, 10);
    this.goToSlide(loop ? idx + children.length : idx);
  }

  handleItemClick = (i, e) => {
    const {onClick, children} = this.props;
    const index = i % children.length;
    onClick && onClick(index, e);
  }

  togglePrevNext(index) {
    const {onSwiped} = this.props;
    this.goToSlide(index);
    onSwiped && onSwiped(this.currentIndex, this.isLastReached);
  }

  handlePrevClick = () => {
    const {currentIndex} = this.state;
    currentIndex !== 0 && this.togglePrevNext(currentIndex - 1);
  }

  handleNextClick = () => {
    const {currentIndex} = this.state;
    !this.isLastReached && this.togglePrevNext(currentIndex + 1);
  }

  isItemActive(i) {
    const len = this.props.children.length;
    return this.state.currentIndex % len === i % len;
  }

  renderItem = (item, i) => {
    const {classNames, gap} = this.props;
    return (
      <div
        key={i}
        data-index={i}
        className={cn(
          classNames.item,
          {[classNames.itemActive]: this.isItemActive(i)},
        )}
        ref={node => this.itemNodes[i] = node}
        style={{marginLeft: gap}}
        onClick={() => this.handleItemClick(i)}
      >
        {item}
      </div>
    );
  }

  renderItems() {
    const {children} = this.props;
    const items = [];
    for (let i = 0; i < children.length * this.state.clonesCount; i++) {
      items.push(this.renderItem(children[i % children.length], i));
    }
    return items;
  }

  renderPrevNext() {
    const {classNames} = this.props;
    return [
      <button
        className={cn(
          classNames.buttonPrev,
        )}
        style={this.state.currentIndex === 0 ? {display: 'none'} : null}
        onClick={this.handlePrevClick}
        key="carousel-button-prev"
      />,
      <button
        className={cn(
          classNames.buttonNext
        )}
        style={this.isLastReached ? {display: 'none'} : null}
        onClick={this.handleNextClick}
        key="carousel-button-next"
      />,
    ];
  }

  renderPagination() {
    const {classNames} = this.props;

    return (
      <div
        className={cn(
          classNames.pagination
        )}
      >
        {this.props.children.map((item, i) => (
          <button
            key={item.key || i}
            data-idx={i}
            className={cn(
              classNames.paginationItem,
              {[classNames.paginationItemActive]: this.isItemActive(i)},
            )}
            onClick={this.handlePaginationClick}
          />
        ))}
      </div>
    );
  }

  render() {
    const {classNames} = this.props;

    return (
      <div
        className={cn(classNames.root)}
      >
        <div
          className={cn(
            classNames.inner
          )}
          ref={node => this.innerNode = node}
          onTransitionEnd={this.handleTransitionEnd}
        >
          { this.renderItems() }
        </div>
        { this.props.prevNext && this.renderPrevNext() }
        { this.props.pagination && this.renderPagination() }
      </div>
    );
  }
}

RCarousel.defaultProps = {
  gap:                0,
  transitionDuration: 0.2,
  classNames:         {
    root:                 '',
    inner:                '',
    item:                 '',
    itemActive:           '',
    pagination:           '',
    paginationItem:       '',
    paginationItemActive: '',
    prevNext:             '',
    buttonNext:           '',
    buttonPrev:           '',
  },
  pagination:          false,
  checkpointThreshold: 2,
  prevNext:            false,
  stopPropagation:     false,
  loop:                false,
  center:              false,
  onInit:              () => {},
  onSwiped:            () => {},
  onClick:             () => {},
  currentIndex:        0,
  disableCheckpoints:  false,
};

RCarousel.propTypes = {
  gap:                pt.number,
  transitionDuration: pt.number,
  classNames:         pt.shape({
    root:                 pt.string,
    inner:                pt.string,
    item:                 pt.string,
    itemActive:           pt.string,
    pagination:           pt.string,
    paginationItem:       pt.string,
    paginationItemActive: pt.string,
    prevNext:             pt.string,
    buttonNext:           pt.string,
    buttonPrev:           pt.string,
  }),
  loop:                pt.bool,
  center:              pt.bool,
  pagination:          pt.bool,
  prevNext:            pt.bool,
  disableCheckpoints:  pt.bool,
  checkpointThreshold: pt.number,
  children:            pt.arrayOf(
    pt.node
  ).isRequired,
  onInit:       pt.func,
  onSwiped:     pt.func,
  onClick:      pt.func,
  currentIndex: pt.number,
};

export default swipeable(RCarousel);
