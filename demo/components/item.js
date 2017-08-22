import React from 'react';
import * as pt from 'prop-types';

const colors = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#3f51b5',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
  '#795548',
  '#9e9e9e',
  '#607d8b',
];

export default class Item extends React.Component {
  getRandomColor() {
    return colors[Math.round(Math.random() * (colors.length - 1))];
  }

  render() {
    const style = {
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      color:           'white',
      fontSize:        '36px',
      width:           this.props.width,
      height:          this.props.height,
      backgroundColor: this.props.color || this.getRandomColor(),
    };

    return <div style={style}>{this.props.text}</div>;
  }
}

Item.defaultProps = {
  width:  100,
  height: 100,
  text:   '',
  color:  '',
};

Item.propTypes = {
  width:  pt.number,
  height: pt.number,
  text:   pt.string,
  color:  pt.string,
};
