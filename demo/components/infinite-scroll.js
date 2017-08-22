import React from 'react';
import RCarousel from '../../src/index';
import sliderStyles from '../carouselStyles.scss';
import Item from './Item';

export default class InfiniteCarousel extends React.Component {

  render() {
    return (
      <RCarousel
        classNames={sliderStyles}
        loop
        gap={30}
      >
        {
        [1, 2, 3, 4, 5, 6].map(num => <Item text={num} />)
        }
      </RCarousel>
    );
  }
}
