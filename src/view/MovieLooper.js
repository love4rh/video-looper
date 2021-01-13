import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { RiPlayFill, RiPauseFill, RiEyeLine, RiEyeOffLine, RiRepeatLine, RiLockLine, RiLockUnlockLine } from 'react-icons/ri';
import { CgPushRight } from 'react-icons/cg';

import { isundef, isvalid, istrue, secToTime } from '../common/tool.js';

// import { TooltipEx } from '../view/TooltipEx.js';
import { ScriptItem } from '../view/ScriptItem.js';
import { VolumeControl } from '../view/VolumeControl.js';

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
      currentTime: 0, // 현재 재생 중인 동영상 위치 (초)
      duration: '00:00:00.000', // 동영상 전체 시간
      volume: 100,
      playing: { running: false }, // 현재 실행 정보
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
        // this.procScriptLooping(playing.index + 1);
        playing.index = playing.index + 1;
        playing.data = scriptData[playing.index];
        playing.start = playing.data.start;
        playing.end = playing.data.end;
        playing.count = 0;

        v.currentTime = Math.max(0, playing.start - 0.2);
        v.play();

        if( !istrue(scrollLock) ) {
          // TODO fine tunning
          this._scriptDiv.current.scrollTop = 32 * playing.index; // 32 --> ScriptItem의 높이임.
        }
      } else {
        v.pause();
        playing.running = false;
        playing.count = 0;

        // 끝까지 실행한 경우로 playing.index 초기화
        if( playing.index === scriptData.length - 1 ) {
          playing.index = null;
        }
      }

      this.setState({ playing: playing, currentTime: v.currentTime });
    }
  }

  procScriptLooping = (idx) => {
    const { scriptData } = this.state;
    const sd = scriptData[idx];
    const v = this._videoDiv.current;

    v.currentTime = Math.max(0, sd.start - 0.2);

    this.setState({
      currentTime: v.currentTime,
      playing: { running: true, index: idx, data: sd, start: sd.start, end: sd.end, count: 0 }
    });

    v.play();
  }

  onLoadedMetadata = (ev) => {
    const $this = ev.target;
    const v = this._videoDiv.current;

    // 동영상, 플레이어 정보 가져오기
    this.setState({
      resolution: {width:$this.videoHeight, height: $this.videoWidth},
      duration: secToTime(v.duration),
      volume: Math.floor(v.volume * 100)
    });
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

  handleVolumeChange = (value) => {
    const v = this._videoDiv.current;

    v.volume = value / 100.0;

    this.setState({ volume: value });
  }

  onControl = (type) => () => {
    const { playing, options } = this.state; // , scriptData, options
    const { repeatCount, pauseRepeat, scrollLock, showScript } = options;

    const v = this._videoDiv.current;

    if( type === 'play/pause' ) {
      type = playing.running ? 'pause' : 'play';
    }

    // console.log('onControl', type, JSON.stringify(playing));

    switch( type ) {
      case 'pause':
        v.pause();
        playing.running = false;
        this.setState({ playing: playing });
        break;

      case 'play':
        if( isundef(playing.index) ) {
          this.procScriptLooping(0);
        } else {
          playing.running = true;
          this.setState({ playing: playing });
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

      case 'repeat':
        options.pauseRepeat = !pauseRepeat;
        this.setState({ options: options });
        break;

      default:
        break;
    }
  }

  render() {
    const { videoURL, resolution, scriptData, playing, options, currentTime, duration, volume } = this.state;
    const { showScript, scrollLock, pauseRepeat } = options;

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
          <div className="PlayingTime">{`${secToTime(currentTime)} / ${duration}`}</div>
          <div className="ControlSeparator">&nbsp;</div>
          <div className="ControlButton" onClick={this.onControl('play/pause')}>
            { playing.running ? <RiPauseFill size="16" /> : <RiPlayFill size="18" /> }
          </div>
          <div className="ControlButton" onClick={this.onControl('show')}>
            { showScript ? <RiEyeOffLine size="16" /> : <RiEyeLine size="16" /> }
          </div>
          <div className="ControlButton" onClick={this.onControl('scroll')}>
            { scrollLock ? <RiLockLine size="16" /> : <RiLockUnlockLine size="16" /> }
          </div>
          <div className="ControlButton" onClick={this.onControl('repeat')}>
            { pauseRepeat ? <CgPushRight size="16" /> : <RiRepeatLine size="16" /> }
          </div>
          <div className="ControlSeparator">&nbsp;</div>
          <div className="ControlItem">
            <VolumeControl value={volume} onChange={this.handleVolumeChange} />
          </div>
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
