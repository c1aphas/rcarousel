import React from 'react';
import * as pt from 'prop-types';
import cn from 'classnames';
import _times from 'lodash/times';
import _findIndex from 'lodash/findIndex';
import ReactResizeDetector from 'react-resize-detector';
import swipeable from './swipeable';

@swipeable
class RCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rend:             1,
      screenFactor:     3,
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
    const {onInit, loop} = this.props;

    this.innerPadding =
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 0) +
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 0);

    this.calcCheckpoints();
    window.addEventListener('orientationchange', this.handleViewportResize.bind(this));
    window.addEventListener('resize', this.handleViewportResize.bind(this));
    // eslint-disable-next-line react/no-did-mount-set-state
    this.calcItems();
    this.setState({rendered: true, currentIndex: this.itemsOnScreen + 1});

    !loop && onInit && onInit();
  }

  componentWillUpdate(nextProps) {
    if (this.props.currentIndex !== nextProps.currentIndex) {
      this.goToSlide(nextProps.currentIndex);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const {children, currentIndex, loop, onInit} = this.props;
    if (children.length !== prevProps.children.length || this.state.rend !== prevState.rend) {
      this.calcItems();
      this.calcCheckpoints();
      this.goToSlide(currentIndex, true);
    }

    loop && onInit && onInit(); // здесь странно вызывать onInit();
  }

  // TODO убрать из линтера ошибку про this
  setStylesWithPrefixes(node, delta, duration = 0.2) {
    requestAnimationFrame(() => {
      Object.assign(node.style, {
        transform:          `translate3d(${delta}px, 0, 0)`,
        transitionDuration: `${duration}s`,
      });
    });
  }

  handleViewportResize() {
    this.calcItems();
    this.calcCheckpoints();
    this.goToSlide(this.state.currentIndex, true);
  }

  calcItems() {
    if (this.props.loop) {
      const width = this.itemWidths
        .slice(0, this.props.children.length)
        .reduce((sum, num) => sum + num, 0);
      const repeatsOnScreen = Math.ceil(this.innerNode.offsetWidth / width);
      this.itemsOnScreen = repeatsOnScreen * this.props.children.length;
      this.setState({
        repeatsOnScreen,
        rend: repeatsOnScreen * 3,
      });
    }
  }

  calcCheckpoints() {
    this.checkpoints = [];
    this.itemWidths = [];
    this.widthTotal = 0;

    for (let i = 0; i < this.itemNodes.length; i++) {
      if (this.itemNodes[i]) {
        const itemWidth = this.itemNodes[i].offsetWidth + this.props.gap;
        this.itemWidths.push(itemWidth);
        this.checkpoints.push((itemWidth / 2) + this.widthTotal);
        this.widthTotal += itemWidth;
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
    this.swippingDelta = this.currentDelta - delta.x;
    this.setStylesWithPrefixes(this.innerNode, this.swippingDelta, 0);
  }

  swipingRight(e, delta) {
    this.swippingDelta = this.currentDelta - delta.x;
    this.setStylesWithPrefixes(this.innerNode, this.swippingDelta, 0);
  }

  swiped(e, {x: deltaX}) {
    this.isSwiped = true;
    this.isToggled = false;
    const {disableCheckpoints, loop, children} = this.props;
    const nextDelta = this.currentDelta - deltaX;
    const maxShift = this.innerNode.offsetWidth - this.widthTotal - this.innerPadding;

    if (!loop && nextDelta > 0) { // Фикс на первый слайд
      this.currentIndex = 0;
      this.currentDelta = 0;
      this.setStylesWithPrefixes(this.innerNode, 0);
    } else
    if (!loop && nextDelta < maxShift) { // Фикс на последний слайд
      this.currentIndex = children.length - 1;
      this.currentDelta = Math.min(maxShift, 0);
      this.setStylesWithPrefixes(this.innerNode, this.currentDelta);
    } else if (disableCheckpoints) { // Свайп-скролл без фиксов на ближайший слайд
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

      const nextIndex = _findIndex(this.checkpoints, (checkpoint, i) =>
           Math.abs(nextDelta) > checkpoint && Math.abs(nextDelta) < this.checkpoints[i + 1]
      );
      this.isToggled = nextIndex !== this.state.currentIndex;
      this.goToSlide(nextIndex);
    }
  }

  findSlideIndex(delta) {
    const absDelta = Math.abs(delta);
    if (absDelta < this.checkpoints[0]) {
      return 0;
    }
    if (absDelta > this.checkpoints[this.checkpoints.length - 1]) {
      return this.checkpoints.length;
    }

  }

  handleTransitionEnd() {
    const {onSwiped, loop} = this.props;
    if (!this.isToggled || !this.isSwiped) {
      return false;
    }

    if (loop) {
      if (this.state.currentIndex < this.itemsOnScreen) {
        this.goToSlide(this.state.currentIndex + this.itemsOnScreen, true);
      } else if (this.state.currentIndex >= this.itemsOnScreen * 2) {
        this.goToSlide(this.state.currentIndex - this.itemsOnScreen, true);
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

  // goToSlide(nextIndex, withoutAnimation) {
  //   const {transitionDuration, loop, gap, children} = this.props;
  //   const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding) + gap;
  //   this.currentIndex = nextIndex;
  //   console.log('GO TO ', nextIndex);
  //
  //   if (!loop && this.widthTotal + this.innerPadding < window.innerWidth) {
  //     this.currentDelta = 0;
  //   } else if (!loop && nextIndex === children.length - 1) {
  //     this.isLastReached = true;
  //     this.currentDelta = lastIndexDelta;
  //   } else if (!loop && nextIndex === 0) {
  //     this.currentDelta = 0;
  //     this.isLastReached = false;
  //   } else {
  //     const nextDelta = -this.itemWidths.slice(
  //       0,
  //       loop ? nextIndex + 1 : nextIndex
  //     ).reduce((a, b) => a + b, 0);
  //     if (nextDelta <= lastIndexDelta) {
  //       this.isLastReached = true;
  //       this.currentDelta = lastIndexDelta;
  //     } else {
  //       this.isLastReached = false;
  //       this.currentDelta = nextDelta;
  //     }
  //   }
  //
  //   this.setStylesWithPrefixes(
  //     this.innerNode,
  //     this.currentDelta,
  //     withoutAnimation ? 0 : transitionDuration
  //   );
  //   this.setState({
  //     currentIndex: nextIndex,
  //     realIndex:    (nextIndex + 1) % children.length,
  //   });
  // }

  goToSlide(nextIndex, withoutAnimation) {
    console.log('GO TO', nextIndex);
    if (nextIndex < 0 || nextIndex >= this.itemWidths.length) return;
    const {transitionDuration, loop, gap, children} = this.props;
    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal - this.innerPadding) + gap;



    let nextDelta = 0;
    for (let i = 0; i <= nextIndex; i++) {
      nextDelta += this.itemWidths[i];
    }

    this.currentIndex = nextIndex;
    this.currentDelta = -nextDelta;
    this.isLastReached = -nextDelta <= lastIndexDelta;

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
        <ReactResizeDetector handleWidth handleHeight onResize={this.handleViewportResize} />
      </div>
    );
  }

  renderLoopItems() {
    const {children} = this.props;
    const itemsCount = children.length;
    const items = [];
    _times(itemsCount * this.state.rend, (i) => {
      items.push(this.renderItem(children[i % itemsCount], i));
    });
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
  onSlideChange:        () => {}, // Нигде не используется
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
