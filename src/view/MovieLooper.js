import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { FaPlay, FaPause } from 'react-icons/fa';
import { RiRepeatLine } from 'react-icons/ri';

import { isundef, isvalid, istrue } from '../common/tool.js';
import { ScriptItem } from '../view/ScriptItem.js';

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
      videoURL: isundef(videoFile) ? '' : URL.createObjectURL(videoFile),
      scriptData,
      loopingInfo: null,
      resolution: { width: 0, height: 0 }
    };

    this._videoDiv = React.createRef();
    this._playTimeChecker = null;

    // looping options
    this._loopLimit = 10; // 구간 반복 회수. -1: 무한 반복.
    this._continuePlay = false; // looping이 끝난 후 계속 플레이 할 지 여부
  }

  componentDidMount () {
    const v = this._videoDiv.current;
    console.log('DidMount', v.videoHeight, v.videoWidth);
  }

  componentWillUnmount () {
    this.clearChecker();
  }

  clearChecker = () => {
    if( isvalid(this._playTimeChecker) ) {
      clearInterval(this._playTimeChecker);
      this._playTimeChecker = null;
    }
  }

  procTimeChecker = () => {
    const { loopInfo } = this.state;

    if( isundef(loopInfo) ) {
      return;
    }

    const v = this._videoDiv.current;

    if( v.currentTime + 0.2 >= loopInfo.end ) {
      loopInfo.count += 1;

      if( loopInfo.count < this._loopLimit || this._loopLimit === -1 ) {
        v.pause();
        setTimeout(() => {
          v.currentTime = Math.max(0, loopInfo.start - 0.2);
          v.play();
        }, 500);
      } else if( !istrue(this._continuePlay) ) {
        v.pause();
      }

      this.setState({ loopInfo: loopInfo });
    }
  }

  procScriptLooping = (sd) => {
    const v = this._videoDiv.current;

    this.setState({ loopInfo: { data: sd, start: sd.start, end: sd.end, count: 0 } });

    console.log('jump to', sd);

    v.currentTime = Math.max(0, sd.start - 0.2);
    v.play();
  }

  onLoadedMetadata = (ev) => {
    const $this = ev.target;
    this.setState({ resolution: {width:$this.videoHeight, height: $this.videoWidth} });
    console.log('onLoadedMetadata', $this.videoHeight, $this.videoWidth);
  }

  handleClick = (idx) => () => {
    const { scriptData } = this.state;
    const sd = scriptData[idx];

    this.procScriptLooping(sd);
  }

  handleVideoPlay = () => {
    console.log('onPlay');
    if( isundef(this._playTimeChecker) ) {
      this._playTimeChecker = setInterval(this.procTimeChecker, 200);
    }
  }

  handleVideoPause = () => {
    console.log('onPause');
    this.clearChecker();
  }

  render() {
    const { videoURL, resolution, scriptData } = this.state;

    return (
      <div className="MovieViewBox">
        <div className={resolution.width > resolution.height ? 'MovieAreaHorizontal' : 'MovieAreaVertical'}>
          <video ref={this._videoDiv}
            className="MovieDiv"
            onLoadedMetadata={this.onLoadedMetadata}
            src={videoURL}
            onPlay={this.handleVideoPlay}
            onPause={this.handleVideoPause}
          />
        </div>
        <div className="ControlArea">
          Controls
        </div>
        <div className="ScriptArea" onClick={this.handleClick(1)}>
          { scriptData.map((sd, idx) => <ScriptItem key={`script-${idx}`} index={idx} data={sd} />) }
        </div>
      </div>
    );
  }
}

export default MovieLooper;
export { MovieLooper} ;
