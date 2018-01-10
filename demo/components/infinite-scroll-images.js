import React from 'react';
import RCarousel from '../../src/index';
import sliderStyles from '../carouselStyles.scss';

export default class InfiniteCarouselImages extends React.Component {

  render() {
    return (
      <RCarousel
        classNames={sliderStyles}
        lazy
        loop
        gap={30}
      >
        <img data-src="https://unsplash.it/500/400?random=1" alt="" width={500} height={400} />
        <img data-src="https://unsplash.it/500/400?random=2" alt="" width={500} height={400} />
        <img data-src="https://unsplash.it/500/400?random=3" alt="" width={500} height={400} />
        <img data-src="https://unsplash.it/500/400?random=4" alt="" width={500} height={400} />
        <img data-src="https://unsplash.it/500/400?random=5" alt="" width={500} height={400} />
        <img data-src="https://unsplash.it/500/400?random=6" alt="" width={500} height={400} />
      </RCarousel>
    );
  }
}
