import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import { secToTime, durationToStr } from '../common/tool.js';

import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { SiPurescript } from 'react-icons/si';

import './styles.scss';



class ScriptItem extends Component {
  static propTypes = {
    index: PropTypes.number,
    data: PropTypes.object,
    selected: PropTypes.bool,
    showText: PropTypes.bool,
    showTime: PropTypes.bool,
    chained: PropTypes.bool,
    onClick: PropTypes.func
  }

  constructor (props) {
    super(props);

    this.state = {
      textShown: props.showText,
      propShown: props.showText
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if( prevState.propShown !== nextProps.showText  ) {
      // 변경이 필요한 것만 반환
      return { textShown: nextProps.showText, propShown: nextProps.showText };
    }

    return null;
  }

  toggleHide = () => {
    const { textShown } = this.state;

    this.setState({ textShown: !textShown });
  }

  handleClick = (ev) => {
    const { shiftKey } = ev;
    const { onClick } = this.props;
    onClick(shiftKey);

    if( ev.preventDefault ) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  toggleRange = (ev) => {

  }

  render () {
		const { data, selected, index, chained, showTime } = this.props;
    const { textShown } = this.state;

    return (
      <div className={ cn({ 'ScriptItem':true, 'ScriptChained':!selected && chained, 'ScriptSelected':selected }) }>
        <div className="ScriptButton" onClick={this.toggleHide}>{textShown ? <RiEyeOffLine /> : <RiEyeLine />}</div>
				<div className="ScriptText" onClick={this.handleClick}>
          {'[' + (index + 1) + '] '} {textShown ? data.text : '...'}
        </div>
        { showTime && <div className="ScriptTime">{ secToTime(data.start) }</div> }
        { showTime && <div className="ScriptLength">{ durationToStr(data.end - data.start) }</div> }
        <div className="ScriptButton" onClick={this.toggleRange}><SiPurescript /></div>
			</div>
    );
  }
};

export default ScriptItem;
export { ScriptItem} ;
