import React, {Component, PropTypes as pt} from 'react';
import cn from 'classnames';
import _ from 'lodash';
import swipeable from './swipeable';

@swipeable
class RCarousel extends Component {
  static setStylesWithPrefixes(node, delta, duration = 0.2) {
    requestAnimationFrame(() => {
      Object.assign(node.style, {
        transform:          `translate3d(${delta}px, 0, 0)`,
        transitionDuration: `${duration}s`,
      });
    });
  }

  constructor(props) {
    super(props);
    this.state = {
      realIndex:        0,
      currentIndex:     0,
      items:            [],
      isClonesRendered: false,
      rendered:         false,
    };

    this.initializeItems = this.initializeItems.bind(this);
    this.initializeSlider = this.initializeSlider.bind(this);
    this.handleTransitionEnd = this.handleTransitionEnd.bind(this);
    this.handlePaginationClick = this.handlePaginationClick.bind(this);
    this.handleItemClick = this.handleItemClick.bind(this);
    this.handlePrevClick = this.handlePrevClick.bind(this);
    this.handleNextClick = this.handleNextClick.bind(this);
    this.renderItem = this.renderItem.bind(this);
  }

  componentWillMount() {
    // server rendering stage.
    this.initializeItems(this.props.children);
  }

  componentDidMount() {
    // front rendering stage, активируем функционал слайдера
    const {onInit, loop} = this.props;

    this.innerPadding =
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-left'), 0) +
      parseInt(getComputedStyle(this.innerNode).getPropertyValue('padding-right'), 0);

    this.initializeSlider();
    window.addEventListener('orientationchange', this.handleViewportResize.bind(this));
    window.addEventListener('resize', this.handleViewportResize.bind(this));
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({rendered: true});

    !loop && onInit && onInit();
  }

  componentWillUpdate(nextProps) {
    if (this.props.currentIndex !== nextProps.currentIndex) {
      this.goToSlide(nextProps.currentIndex);
    }
  }

  async componentDidUpdate(prevProps) {
    const {children, currentIndex, loop, onInit} = this.props;
    // Если изменились children, нужно все заново пересчитать
    if (children.length !== prevProps.children.length) {
      await this.initializeItems(children);
      await this.calcCheckpoints();
      this.goToSlide(currentIndex, true);
    }

    loop && onInit && onInit();
  }

  handleViewportResize() {
    this.calcCheckpoints();
    this.goToSlide(this.state.currentIndex, true);
  }

  calcCheckpoints() {
    const {gap, loop} = this.props;

    this.checkpoints = [];
    this.itemWidths = [];
    this.widthTotal = 0;

    _.times(
      loop ? this.state.itemsCount * 3 : this.state.itemsCount,
      (i) => {
        const itemNode = this.itemNodes[
          loop
            ? i % this.state.itemsCount
            : i
        ];
        const itemWidth = itemNode.offsetWidth + gap;

        this.itemWidths.push(itemWidth);
        this.widthTotal += itemWidth;
        itemNode && this.checkpoints.push(
          ((itemNode.offsetWidth + gap) / 2) + ((itemNode.offsetWidth + gap) * i)
        );
      }
    );
  }

  currentDelta = 0;
  widthTotal = 0;
  checkpoints = [];
  itemWidth = 0;
  itemWidths = [];
  itemNodes = [];
  isToggled = false;
  isLastReached = false;

  initializeItems(childrenItems) {
    this.setState({
      items:      childrenItems.map((item, i) => this.renderItem(item, i)),
      itemsCount: childrenItems.length,
    });
  }

  initializeSlider() {
    const {loop} = this.props;
    this.calcCheckpoints();
    loop && this.renderLoopItems();
  }

  swipingLeft(e, delta) {
    RCarousel.setStylesWithPrefixes(this.innerNode, this.currentDelta - delta.x, 0);
  }

  swipingRight(e, delta) {
    RCarousel.setStylesWithPrefixes(this.innerNode, this.currentDelta - delta.x, 0);
  }

  swiped(e, {x: deltaX}) {
    this.isSwiped = true;
    this.isToggled = false;
    const {disableCheckpoints, loop} = this.props;
    const nextDelta = this.currentDelta - deltaX;
    const maxShift = window.innerWidth - this.widthTotal - this.innerPadding;

    // Фикс на первый слайд
    if (nextDelta > 0) {
      this.currentIndex = 0;
      this.currentDelta = 0;
      RCarousel.setStylesWithPrefixes(this.innerNode, 0);
    } else
    // Фикс на последний слайд
    if (nextDelta < maxShift) {
      this.currentIndex = this.state.itemsCount - 1;
      this.currentDelta = maxShift;
      RCarousel.setStylesWithPrefixes(this.innerNode, maxShift);
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
      RCarousel.setStylesWithPrefixes(this.innerNode, this.currentDelta, 0);
    } else {
        // Фикс на ближайший слайд
      const nextIndex = _.findIndex(this.checkpoints, (checkpoint, i) =>
           Math.abs(nextDelta) > checkpoint && Math.abs(nextDelta) < this.checkpoints[i + 1]
      ) + (loop ? 0 : 1);
      this.isToggled = nextIndex !== this.state.currentIndex;
      this.goToSlide(nextIndex);
    }
  }

  handleTransitionEnd() {
    const {onSwiped, loop} = this.props;
    if (!this.isToggled || !this.isSwiped) {
      return false;
    }
    if (loop) {
      const min = this.itemNodes.length / 3;
      const max = this.itemNodes.length - this.state.itemsCount - 1;
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
    const {loop, onClick} = this.props;
    const clickedIndex = loop ? i % this.state.itemsCount : i;

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
    const {transitionDuration, loop, gap} = this.props;
    const lastIndexDelta = (this.innerNode.offsetWidth - this.widthTotal) + gap;
    this.currentIndex = nextIndex;

    if (!loop && this.widthTotal < window.innerWidth) {
      this.currentDelta = 0;
    } else if (!loop && nextIndex === this.state.itemsCount - 1) {
      this.isLastReached = true;
      this.currentDelta = lastIndexDelta;
    } else if (!loop && nextIndex === 0) {
      this.currentDelta = 0;
    } else {
      const nextDelta = -this.itemWidths.slice(
        0,
        loop ? nextIndex + 1 : nextIndex
      ).reduce((a, b) => a + b);
      if (nextDelta <= lastIndexDelta) {
        this.isLastReached = true;
        this.currentDelta = lastIndexDelta;
      } else {
        this.isLastReached = false;
        this.currentDelta = nextDelta;
      }
    }

    RCarousel.setStylesWithPrefixes(
      this.innerNode,
      this.currentDelta,
      withoutAnimation ? 0 : transitionDuration
    );
    this.setState({
      currentIndex: nextIndex,
      realIndex:    (nextIndex + 1) % this.state.itemsCount,
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
        key={`${i}`}
        className={cn(
          classNames.item,
          {[classNames.itemActive]: this.isItemActive(i)},
        )}
        ref={node => this.itemNodes[i] = node}
        style={{marginLeft: gap}}
        {...additionalAttrs}
      >
        <item.type {...item.props} />
      </div>
    );
  }

  renderLoopItems() {
    const {children} = this.props;
    const items = [];
    _.times(this.state.itemsCount * 3, (i) => {
      items.push(this.renderItem(children[i % children.length], i));
    });
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({items});
    this.goToSlide(this.state.itemsCount - 1, true);
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
    const {items} = this.state;

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
          {items.map((item, i) => this.renderItem(item.props.children, i))}
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
                      ? (this.state.currentIndex + 1) % 5 === i
                      : i === 0,
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
  pagination:         false,
  prevNext:           false,
  stopPropagation:    false,
  loop:               false,
  onSlideChange:      () => {},
  onInit:             () => {},
  onSwiped:           () => {},
  onClick:            () => {},
  currentIndex:       -1,
  disableCheckpoints: false,
  isMobile:           false,
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
