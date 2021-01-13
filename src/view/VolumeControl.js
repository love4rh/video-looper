import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { RiVolumeUpLine, RiVolumeMuteLine } from 'react-icons/ri';

import Form from 'react-bootstrap/Form';


class VolumeControl extends Component {
	static propTypes = {
		value: PropTypes.number,
		onChange: PropTypes.func
	}
  
	constructor (props) {
		super(props);

		const { value } = this.props;

		this.state = {
			value: value,
			propValue: value,
			muted: value === 0
		};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
    if( prevState.propValue !== nextProps.value  ) {
      // 변경이 필요한 것만 반환
      return { value: nextProps.value, propValue: nextProps.value, muted: nextProps.value === 0 };
    }

    return null;
  }

	handleChange = (ev) => {
		const { onChange } = this.props;

		const $this = ev.target;
		const val = parseInt($this.value);

		this.setState({ value: val, muted: val === 0 });

		if( onChange ) {
			onChange('updown', val);
		}
	}

	handleClick = () => {
		const { muted } = this.state;
		const { onChange } = this.props;

		this.setState({ muted: !muted });

		if( onChange ) {
			onChange('mute', !muted);
		}
	}

	render () {
		const { value, muted } = this.state;

		return (
			<div className="VolumeAdjust">
				<div className="VolumelButton" onClick={this.handleClick}>
					{ muted ? <RiVolumeMuteLine className="ButtonAdjust" sie="16" /> : <RiVolumeUpLine className="ButtonAdjust" size="16" /> }
				</div>
				<Form.Control
					className="VolumeBar"
					type="range"
					custom
					value={muted ? 0 : value}
					min={0}
					max={100}
					onChange={this.handleChange}
				/>
			</div>
		);
	}
}

export default VolumeControl;
export { VolumeControl};
