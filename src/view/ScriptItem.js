import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { isundef, isvalid, istrue } from '../common/tool.js';


import './styles.scss';



class ScriptItem extends Component {
  static propTypes = {
    index: PropTypes.number,
    data: PropTypes.object
  }

  constructor (props) {
    super(props);
  }

  render () {
		const { data } = this.props;

    return (
      <div className="ScriptItem">
				{data.text}
			</div>
    );
  }
};

export default ScriptItem;
export { ScriptItem} ;
