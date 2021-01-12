import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { RiPlayLine, RiPauseFill, RiEyeLine, RiEyeOffLine, RiRepeatLine, RiLockLine, RiLockUnlockLine } from 'react-icons/ri';

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

    // options
    //   repeatCount - 구간 반복 회수. -1: 무한 반복.
    //   pauseRepeat - repeat이 끝난 후 정지 여부. false이면 다음 스크립트로 이동
    //   scrollLock - 스크립트 현재 위치 고정 여부. false이면 다음 스크립트로 스크롤

    this.state = {
      videoFile,
      videoURL: isundef(videoFile) ? '' : URL.createObjectURL(videoFile),
      scriptData,
      resolution: { width: 0, height: 0 },
      playing: {}, // 현재 실행 정보
      options: { repeatCount: 2, pauseRepeat: false, scrollLock: false, showScript: false }
    };

    this._videoDiv = React.createRef();
    this._scriptDiv = React.createRef();

    this._playTimeChecker = null;
  }

  componentDidMount () {
    // const v = this._videoDiv   .current;
    // console.log('DidMount', v.videoHeight, v.videoWidth);
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
    const { playing, scriptData, options } = this.state;
    const { repeatCount, pauseRepeat, scrollLock } = options;

    if( isundef(playing) ) {
      return;
    }

    const v = this._videoDiv.current;

    if( v.currentTime + 0.2 >= playing.end ) {
      playing.count += 1;

      if( playing.count < repeatCount || repeatCount === -1 ) {
        v.pause();
        setTimeout(() => {
          v.currentTime = Math.max(0, playing.start - 0.2);
          v.play();
        }, 500);
      } else if( !istrue(pauseRepeat) && playing.index < scriptData.length - 1 ) {
        this.procScriptLooping(playing.index + 1);

        if( !istrue(scrollLock) ) {
          this._scriptDiv.current.scrollTop = 32 * playing.index;
        }
        return; // RETURN!!!
      } else {
        v.pause();
      }

      this.setState({ playing: playing });
    }
  }

  procScriptLooping = (idx) => {
    const { scriptData } = this.state;
    const sd = scriptData[idx];
    const v = this._videoDiv.current;

    this.setState({ playing: { index: idx, data: sd, start: sd.start, end: sd.end, count: 0 } });

    v.currentTime = Math.max(0, sd.start - 0.2);
    v.play();
  }

  onLoadedMetadata = (ev) => {
    const $this = ev.target;
    this.setState({ resolution: {width:$this.videoHeight, height: $this.videoWidth} });
    // console.log('onLoadedMetadata', $this.videoHeight, $this.videoWidth);
  }

  handleScriptClick = (idx) => () => {
    this.procScriptLooping(idx);
  }

  handleVideoPlay = () => {
    // console.log('onPlay');
    if( isundef(this._playTimeChecker) ) {
      this._playTimeChecker = setInterval(this.procTimeChecker, 200);
    }
  }

  handleVideoPause = () => {
    // console.log('onPause');
    this.clearChecker();
  }

  onControl = (type) => () => {
    const { playing, options } = this.state; // , scriptData, options
    const { repeatCount, pauseRepeat, scrollLock, showScript } = options;

    const v = this._videoDiv.current;

    switch( type ) {
      case 'pause':
        v.pause();
        break;

      case 'play':
        if( isundef(playing.index) ) {
          this.procScriptLooping(0);
        } else {
          v.play();
        }
        break;

      case 'show':
        options.showScript = !showScript;
        this.setState({ options: options });
        break;

      case 'scroll':
        options.scrollLock = !scrollLock;
        this.setState({ options: options });
        break;

      default:
        break;
    }
  }

  render() {
    const { videoURL, resolution, scriptData, playing, options } = this.state;
    const { showScript, scrollLock } = options;

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
          <div className="ControlButton" onClick={this.onControl('play')}><RiPlayLine size="16" /></div>
          <div className="ControlButton" onClick={this.onControl('pause')}><RiPauseFill size="16" /></div>
          <div className="ControlButton" onClick={this.onControl('show')}>{showScript ? <RiEyeOffLine size="16" /> : <RiEyeLine size="16" />}</div>
          <div className="ControlButton" onClick={this.onControl('scroll')}>{scrollLock ? <RiLockUnlockLine size="16" /> : <RiLockLine size="16" />}</div>          
        </div>
        <div className="ScriptArea">
          <div ref={this._scriptDiv} className="ScriptScroll">
            { scriptData.map((sd, idx) => {
                return (
                  <ScriptItem
                    key={`script-${idx}`}
                    index={idx}
                    data={sd}
                    selected={playing.index === idx}
                    showAll={showScript}
                    onClick={this.handleScriptClick(idx)}
                  />
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default MovieLooper;
export { MovieLooper} ;
