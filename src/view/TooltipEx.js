import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { nvl } from '../common/tool.js';

import Tooltip from 'react-bootstrap/Tooltip'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'


class TooltipEx extends Component {
	static propTypes = {
		tipID: PropTypes.string.isRequired,
		desc: PropTypes.string.isRequired,
		position: PropTypes.string
	}
  
	constructor (props) {
		super(props);

		const { tipID, desc, position } = this.props;

		this.state = {
			tipID, desc, position: nvl(position, 'bottom')
		}
	}

	render () {
		const { tipID, desc, position } = this.state;

		return (
			<OverlayTrigger
				placement={position}
				delay={{ show: 250, hide: 400 }}
				overlay={<Tooltip id={tipID}>{desc}</Tooltip>}
			>
				{this.props.children}
			</OverlayTrigger>
		);
	}
}

export default TooltipEx;
export { TooltipEx} ;
