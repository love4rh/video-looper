import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Form from 'react-bootstrap/Form'


class VolumeControl extends Component {
	static propTypes = {
		value: PropTypes.number,
		onChange: PropTypes.func
	}
  
	constructor (props) {
		super(props);

		const { value } = this.props;

		this.state = {
			value
		};
	}

	handleChange = (ev) => {
		const { onChange } = this.props;

		const $this = ev.target;
		const val = $this.value;

		this.setState({ value: val });

		if( onChange ) {
			onChange(val);
		}
	}

	render () {
		const { value } = this.state;

		return (
			<div className="VolumeAdjust">
				<div className="VolumeTitle">Volume</div>
				<Form.Control className="VolumeBar" type="range" custom value={value} min={0} max={100} onChange={this.handleChange} />
			</div>
		);
	}
}

export default VolumeControl;
export { VolumeControl};
