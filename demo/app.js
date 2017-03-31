import React from 'react';
import ReactDom from 'react-dom';
import RCarousel from '../src/index';
import sliderStyles from './carouselStyles.scss';

class App extends React.Component {
  render() {
    return (
      <div style={{width: '80%', margin: 'auto'}}>
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
      </div>
    );
  }
}

const content = document.getElementById('content');

ReactDom.render(<App />, content);
