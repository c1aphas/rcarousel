import React from 'react';
import RCarousel from '../../src/index';
import sliderStyles from '../carouselStyles.scss';

export default class SimpleCarousel extends React.Component {

  render() {
    return (
      <RCarousel
        classNames={sliderStyles}
        prevNext
        gap={30}
      >
        <img src="https://unsplash.it/600/400?random=1" alt="" />
        <img src="https://unsplash.it/600/400?random=2" alt="" />
        <img src="https://unsplash.it/600/400?random=3" alt="" />
        <img src="https://unsplash.it/600/400?random=4" alt="" />
        <img src="https://unsplash.it/600/400?random=5" alt="" />
        <img src="https://unsplash.it/600/400?random=6" alt="" />
      </RCarousel>
    );
  }
}
