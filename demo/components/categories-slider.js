import React from 'react';
import RCarousel from '../../src/index';
import sliderStyles from '../carouselStyles.scss';
import s from '../styles.scss';

const categories = ['north', 'east', 'south', 'west', 'center'];

export default class TabCarousel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sectionIndex: 0,
    };

    this.handleCategoryClick = this.handleCategoryClick.bind(this);
  }

  handleCategoryClick(selectedIndex) {
    this.setState({sectionIndex: selectedIndex});
  }

  render() {
    return (
      <div>
        <header>
          <RCarousel
            currentIndex={this.state.sectionIndex}
            onClick={this.handleCategoryClick}
            classNames={sliderStyles}
            disableCheckpoints
            gap={30}
          >
            {categories.map(item =>
              <div className={s.headerItem} key={`key-${item}`}>{item}</div>
            )}
          </RCarousel>
        </header>
        <section>
          <RCarousel
            classNames={sliderStyles}
            currentIndex={this.state.sectionIndex}
            gap={30}
          >
            <img src={`https://unsplash.it/200/300?gravity=${categories[this.state.sectionIndex]}`} alt="" />
            <img src={`https://unsplash.it/200/300?gravity=${categories[this.state.sectionIndex]}`} alt="" />
          </RCarousel>
        </section>
      </div>
    );
  }
}

