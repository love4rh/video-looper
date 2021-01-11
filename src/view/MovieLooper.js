import React, { Component } from 'react';
import PropTypes from 'prop-types';

// import { isundef, readTextFile} from '../common/tool.js';

import './styles.scss';



class MovieLooper extends Component {
  static propTypes = {
    scriptData: PropTypes.array,
    videoFile: PropTypes.object
  }

  constructor (props) {
    super(props);

    const { scriptData, videoFile } = this.props;

    this.state = {
      videoFile,
      videoURL: URL.createObjectURL(videoFile),
      scriptData
    };

    this._videoDiv = React.createRef();
  }

  handleClick = (idx) => () => {
    const { scriptData } = this.state;

    console.log(idx, scriptData[idx]);
    this._videoDiv.current.currentTime = scriptData[idx].start - 0.2;
  }

  render() {
    const { videoURL } = this.state;

    return (
      <div className="MovieViewBox">
        <div className="MovieArea">
          <video ref={this._videoDiv} className="MovieDiv" src={videoURL} controls />

          <div className="MovieOverlay">TEST MESSAGE</div>
        </div>
        <div className="ScriptArea" onClick={this.handleClick(1)}>
          AAA
        </div>
      </div>
    );
  }
}

export default MovieLooper;
export { MovieLooper} ;
