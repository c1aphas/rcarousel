import React from 'react';
import * as pt from 'prop-types';
import cn from 'classnames';
import swipeable from './swipeable';

@swipeable
class RCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
    this.renderItem = this.renderItem.bind(this);
    this.handleViewportResize = this.handleViewportResize.bind(this);
  }

  componentDidMount() {
    const {onInit, loop, children} = this.props;
    const itemsCount = children.length;

    this.innerPadding =
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 0) +
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 0);

    this.calcCheckpoints();
    window.addEventListener('orientationchange', this.handleViewportResize);
    window.addEventListener('resize', this.handleViewportResize);
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({rendered: true});

    loop && this.goToSlide(itemsCount - 1, true);

    !loop && onInit && onInit();
  }

  componentWillUpdate(nextProps) {
    if (this.props.currentIndex !== nextProps.currentIndex) {
      this.goToSlide(nextProps.currentIndex);
    }
  }

  componentDidUpdate(prevProps) {
    const {children, currentIndex, loop, onInit} = this.props;
    if (children.length !== prevProps.children.length) {
      this.calcCheckpoints();
      this.goToSlide(currentIndex, true);
    }

    loop && onInit && onInit();
  }

  componentWillUnmount() {
    window.removeEventListener('orientationchange', this.handleViewportResize);
    window.removeEventListener('resize', this.handleViewportResize);
  }

  setStylesWithPrefixes(node, delta, duration = 0.2) {
    requestAnimationFrame(() => {
      Object.assign(node.style, {
        transform:          `translate3d(${delta}px, 0, 0)`,
        transitionDuration: `${duration}s`,
      });
    });
    this.swippingDelta = delta;
  }

  handleViewportResize() {
    this.calcCheckpoints();
    this.goToSlide(this.state.currentIndex, true);
  }

  calcCheckpoints() {
    const {gap} = this.props;

    this.checkpoints = [];
    this.itemWidths = [];
    this.widthTotal = 0;

    for (let i = 0; i < this.itemNodes.length; i++) {
      if (this.itemNodes[i]) {
        const itemWidth = this.itemNodes[i].offsetWidth + gap;
        this.itemWidths.push(itemWidth);
        this.widthTotal += itemWidth;
        this.checkpoints.push((itemWidth / 2) + this.widthTotal);
      }
    }
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
    this.setStylesWithPrefixes(this.innerNode, this.currentDelta - delta.x, 0);
  }

  swipingRight(e, delta) {
    this.setStylesWithPrefixes(this.innerNode, this.currentDelta - delta.x, 0);
  }

  swiped(e, {x: deltaX}) {
    this.isSwiped = true;
    this.isToggled = false;
    const {disableCheckpoints, loop, children} = this.props;
    const nextDelta = this.currentDelta - deltaX;
    const maxShift = window.innerWidth - this.widthTotal - this.innerPadding;

    // Фикс на первый слайд
    if (!loop && nextDelta > 0) {
      this.currentIndex = 0;
      this.currentDelta = 0;
      this.setStylesWithPrefixes(this.innerNode, 0);
    } else
    // Фикс на последний слайд
    if (!loop && nextDelta < maxShift) {
      this.currentIndex = children.length - 1;
      this.currentDelta = Math.min(maxShift, 0);
      this.setStylesWithPrefixes(this.innerNode, this.currentDelta);
    } else
    // Свайп-скролл без фиксов на ближайший слайд
    if (disableCheckpoints) {
      if (loop) {
        const itemsWidthPerScreen = this.widthTotal / 3;
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
      const nextIndex = this.findNextIndex(nextDelta);
      this.isToggled = nextIndex !== this.state.currentIndex;
      this.goToSlide(nextIndex);
    }
  }

  findNextIndex(delta) {
    const val = Math.abs(delta);
    for (let i = 0; i < this.checkpoints.length; i++) {
      if (i === this.checkpoints.length - 1) return -1;
      if (val > this.checkpoints[i] && val <= this.checkpoints[i + 1]) return i;
    }
    return -1;
    // return this.checkpoints.findIndex((checkpoint, i, checkpoints) =>
    //     Math.abs(delta) > checkpoint && Math.abs(delta) < checkpoints[i + 1]
    //   ) + (this.props.loop ? 0 : 1);
  }

  handleTransitionEnd() {
    const {onSwiped, loop, children} = this.props;
    if (!this.isToggled || !this.isSwiped) {
      return false;
    }
    if (loop) {
      const min = this.itemNodes.length / 3;
      const max = this.itemNodes.length - children.length - 1;
      if (this.state.currentIndex < min - 1) {
        // достигли первого слайда, показали последний
        this.goToSlide(max - 1, true);
      } else if (this.state.currentIndex >= max) {
        // достигли последнего слайда, показали первый
        this.goToSlide(min - 1, true);
      }
    }
    onSwiped && onSwiped(this.currentIndex);
  }

  handlePaginationClick(e) {
    e.stopPropagation();
    const idx = parseInt(e.target.dataset.idx, 0);
    this.goToSlide(idx + 4);
  }

  handleItemClick(i) {
    const {loop, onClick, children} = this.props;
    const clickedIndex = loop ? i % children.length : i;

    onClick && onClick(clickedIndex, this.state);
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

  goToSlide(nextIndex, withoutAnimation) {
    const {transitionDuration, loop, gap, children} = this.props;
    if (!this.innerNode || nextIndex < 0) return;

    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding) + gap;
    this.currentIndex = nextIndex;

    if (loop) {
      const nextDelta = -this.itemWidths.slice(
        0,
        loop ? nextIndex + 1 : nextIndex
      ).reduce((a, b) => a + b, 0);
      if (nextDelta <= lastIndexDelta) {
        this.isLastReached = true;
        this.currentDelta = lastIndexDelta;
      } else {
        this.isLastReached = false;
        this.currentDelta = nextDelta;
      }
    } else
      if (this.widthTotal + this.innerPadding < window.innerWidth) {
        this.currentDelta = 0;
      } else if (nextIndex === children.length - 1) {
        this.isLastReached = true;
        this.currentDelta = lastIndexDelta;
      } else if (nextIndex === 0) {
        this.currentDelta = 0;
        this.isLastReached = false;
      }

    this.setStylesWithPrefixes(
      this.innerNode,
      this.currentDelta,
      withoutAnimation ? 0 : transitionDuration
    );
    this.setState({
      currentIndex: nextIndex,
      realIndex:    (nextIndex + 1) % children.length,
    });
  }

  isItemActive(i) {
    const {loop} = this.props;
    if (!this.state.rendered) return false;
    return loop
      ? i % (this.state.currentIndex + 1) === 0
      : this.state.currentIndex === i;
  }

  renderItem(item, i) {
    const {classNames, gap, isMobile} = this.props;
    const additionalAttrs = {};
    if (isMobile) {
      additionalAttrs.onTouchTap = () => this.handleItemClick(i);
    } else {
      additionalAttrs.onClick = () => this.handleItemClick(i);
    }
    return (
      <div
        key={i}
        className={cn(
          classNames.item,
          {[classNames.itemActive]: this.isItemActive(i)},
        )}
        ref={node => this.itemNodes[i] = node}
        style={{marginLeft: gap}}
        {...additionalAttrs}
      >
        {item}
      </div>
    );
  }

  renderLoopItems() {
    const {children} = this.props;
    const itemsCount = children.length;
    const items = [];
    for (let i = 0; i < itemsCount * 3; i++) {
      items.push(this.renderItem(children[i % itemsCount], i));
    }
    return items;
  }

  renderItems() {
    return this.props.children.map(this.renderItem);
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

  render() {
    const {classNames, loop} = this.props;

    return (
      <div
        className={cn(classNames.root)}
        ref={node => this.rootNode = node}
      >
        <div
          className={cn(
            classNames.inner
          )}
          ref={node => this.innerNode = node}
          onTransitionEnd={this.handleTransitionEnd}
        >
          { loop ? this.renderLoopItems() : this.renderItems() }
        </div>
        { this.props.prevNext && this.renderPrevNext() }
        { this.props.pagination && (
          <div
            className={cn(
              classNames.pagination
            )}
          >
            {this.props.children.map((item, i) => (
              <button
                key={item.key}
                data-idx={i}
                className={cn(
                  classNames.paginationItem,
                  {[classNames.paginationItemActive]:
                    loop
                      ? i === (this.state.currentIndex + 1) % 5
                      : i === this.state.currentIndex,
                  },
                )}
                onClick={this.handlePaginationClick}
              />
            ))}
          </div>
          )
        }
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
  onSlideChange:        () => {},
  onInit:               () => {},
  onSwiped:             () => {},
  onClick:              () => {},
  currentIndex:         -1,
  disableCheckpoints:   false,
  isMobile:             false,
  isRelatedInnerSlider: false,
};

RCarousel.propTypes = {
  isMobile:           pt.bool,
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

export default RCarousel;
