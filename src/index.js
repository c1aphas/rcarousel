import React from 'react';
import * as pt from 'prop-types';
import cn from 'classnames';
import swipeable from './swipeable';

const SCREEN_FACTOR = 3;

class RCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rend:             1,
      realIndex:        0,
      currentIndex:     0,
      isClonesRendered: false,
      rendered:         false,
    };

    this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
    this.handlePaginationClick = this.handlePaginationClick.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handlePrevClick = this.handlePrevClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.handleViewportResize = this.handleViewportResize.bind(this);
  }

  componentDidMount() {
    const {onInit, loop, currentIndex} = this.props;

    this.innerPadding =
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 10) +
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 10);
    window.addEventListener('orientationchange', this.handleViewportResize);
    window.addEventListener('resize', this.handleViewportResize);

    this.calcBasicValues();
    if (loop) {
      this.setState({rend: this.repeatsOnScreen * SCREEN_FACTOR});
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
    if (children.length !== prevProps.children.length || this.state.rend !== prevState.rend) {
      this.calcBasicValues();
      this.goToSlide(loop ? this.itemsOnScreen + currentIndex : currentIndex, true);
    }

    loop && onInit && onInit();
  }

  componentWillUnmount() {
    window.removeEventListener('orientationchange', this.handleViewportResize);
    window.removeEventListener('resize', this.handleViewportResize);
  }

  setStylesWithPrefixes(node, delta, duration = 0.3) {
    this.rafId = requestAnimationFrame(() => {
      Object.assign(node.style, {
        transform:          `translate3d(${delta}px, 0, 0)`,
        transitionDuration: `${duration}s`,
      });
    });
  }

  getRepeatOnScreen(childrenWidth) {
    return this.innerNode === null ? 1 : Math.ceil(this.innerNode.offsetWidth / childrenWidth);
  }

  getItemWidths() {
    const itemWidths = [];
    for (let i = 0; i < this.props.children.length; i++) {
      if (this.itemNodes[i]) {
        itemWidths.push(this.itemNodes[i].offsetWidth + this.props.gap);
      }
    }
    return itemWidths;
  }

  getChildrenWidth(itemWidths) {
    let total = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      total += itemWidths[i];
    }
    return total;
  }

  getCheckpoints(itemWidths) {
    let sum = 0;
    const checkpoints = [];
    for (let i = 0; i < itemWidths.length * this.state.rend; i++) {
      checkpoints.push((itemWidths[i % itemWidths.length] / 2) + sum);
      sum += itemWidths[i % itemWidths.length];
    }
    return checkpoints;
  }

  calcBasicValues() {
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

  handleViewportResize() {
    this.calcBasicValues();
    if (this.props.loop) {
      this.setState({rend: this.repeatsOnScreen * SCREEN_FACTOR});
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
    this.setStylesWithPrefixes(this.innerNode, this.swippingDelta, 0);
  }

  swipingRight(e, delta) {
    this.swippingDelta = this.currentDelta - delta.x;
    this.setStylesWithPrefixes(this.innerNode, this.swippingDelta, 0);
  }

  swiped(e, {x: deltaX}) {
    this.isToggled = false;
    const {disableCheckpoints, gap, onSwiped, transitionDuration} = this.props;
    const nextDelta = this.currentDelta - deltaX;
    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding) + gap;

    if (disableCheckpoints) {
      if (nextDelta > 0) {
        this.currentDelta = 0;
      } else if (nextDelta <= lastIndexDelta) {
        this.currentDelta = Math.min(lastIndexDelta, 0);
      } else {
        this.currentDelta = nextDelta;
      }
      this.setStylesWithPrefixes(this.innerNode, this.currentDelta, transitionDuration);
    } else {
      const nextIndex = this.findSlideIndex(nextDelta);
      this.isToggled = nextIndex !== this.state.currentIndex;
      this.goToSlide(nextIndex);
    }
    onSwiped && onSwiped(this.currentIndex);
  }

  findSlideIndex(delta) {
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

  handleTransitionEnd() {
    const {loop, disableCheckpoints} = this.props;

    if (loop) {
      if (disableCheckpoints) {
        if (Math.abs(this.currentDelta) >= this.childrenWidth * 2) {
          this.currentDelta += this.childrenWidth;
        } else if (Math.abs(this.currentDelta) <= this.childrenWidth) {
          this.currentDelta -= this.childrenWidth;
        }
        this.setStylesWithPrefixes(this.innerNode, this.currentDelta, 0);
      } else if (this.state.currentIndex < this.itemsOnScreen) {
        this.goToSlide(this.state.currentIndex + this.itemsOnScreen, true);
      } else if (this.state.currentIndex >= this.itemsOnScreen * 2) {
        this.goToSlide(this.state.currentIndex - this.itemsOnScreen, true);
      }
    }
  }

  goToSlide(nextIndex, withoutAnimation) {
    if (nextIndex < 0 || nextIndex >= this.itemNodes.length || this.innerNode === null) return;

    const {transitionDuration, loop, gap, children} = this.props;
    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding) + gap;

    let nextDelta = 0;
    for (let i = 0; i < nextIndex; i++) {
      nextDelta -= this.itemWidths[i % children.length];
    }

    if (!loop && nextDelta <= lastIndexDelta) {  // фикс для последнего слайда
      this.currentDelta = Math.min(lastIndexDelta, 0);
    } else {
      this.currentDelta = nextDelta;
    }

    this.isLastReached = nextDelta <= lastIndexDelta;
    this.currentIndex = nextIndex;

    this.setStylesWithPrefixes(
      this.innerNode,
      this.currentDelta,
      withoutAnimation ? 0 : transitionDuration
    );
    this.setState({
      currentIndex: nextIndex,
      realIndex:    nextIndex % children.length,
    });
  }

  handlePaginationClick(e) {
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

  handlePrevClick() {
    const {currentIndex} = this.state;
    currentIndex !== 0 && this.togglePrevNext(currentIndex - 1);
  }

  handleNextClick() {
    const {currentIndex} = this.state;
    !this.isLastReached && this.togglePrevNext(currentIndex + 1);
  }

  isItemActive(i) {
    const len = this.props.children.length;
    return this.state.currentIndex % len === i % len;
  }

  renderItem(item, i) {
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
        onClick={e => this.handleItemClick(i, e)}
      >
        {item}
      </div>
    );
  }

  renderItems() {
    const {children} = this.props;
    const items = [];
    for (let i = 0; i < children.length * this.state.rend; i++) {
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
  pagination:           false,
  prevNext:             false,
  stopPropagation:      false,
  loop:                 false,
  onSlideChange:        () => {}, // Нигде не используется
  onInit:               () => {},
  onSwiped:             () => {},
  onClick:              () => {},
  currentIndex:         0,
  disableCheckpoints:   false,
  isRelatedInnerSlider: false,
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
  loop:               pt.bool,
  pagination:         pt.bool,
  prevNext:           pt.bool,
  disableCheckpoints: pt.bool,
  children:           pt.arrayOf(
    pt.node
  ).isRequired,
  onInit:       pt.func,
  onSwiped:     pt.func,
  onClick:      pt.func,
  currentIndex: pt.number,
};

export default swipeable(RCarousel);
