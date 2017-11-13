import React from 'react';
import ReactDom from 'react-dom';
// import injectTapEventPlugin from 'react-tap-event-plugin';
import {
  SimpleCarousel,
  InfiniteCarousel,
  TabCarousel,
} from './components';
import s from './styles.scss';

// injectTapEventPlugin();

class App extends React.Component {
  render() {
    return (
      <section>
        <div className={s.example}>
          <h2 className={s.header}>
            Simple carousel
          </h2>
          <div style={{width: '65%', margin: 'auto'}}>
            <SimpleCarousel />
          </div>
        </div>
        <div className={s.example}>
          <h2 className={s.header}>
            Infinite carousel
          </h2>
          <InfiniteCarousel />
        </div>
        <div className={s.example}>
          <h2 className={s.header}>
            Tab carousel
          </h2>
          <TabCarousel />
        </div>
      </section>
    );
  }
}

ReactDom.render(<App />, document.getElementById('content'));
