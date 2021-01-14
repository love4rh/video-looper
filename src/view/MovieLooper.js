import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  RiPlayFill, RiPauseFill, RiEyeLine, RiEyeOffLine, RiRepeatLine,
  RiLockLine, RiLockUnlockLine, RiArrowDownLine, RiArrowUpLine
} from 'react-icons/ri';

import { CgPushRight, CgArrowLongRightL } from 'react-icons/cg';

import { isundef, isvalid, istrue, secToTime, nvl } from '../common/tool.js';

import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// import { TooltipEx } from '../view/TooltipEx.js';
import { ScriptItem } from '../view/ScriptItem.js';
import { VolumeControl } from '../view/VolumeControl.js';

import './styles.scss';


const attachTooltip = (tooltip, tag) => {
  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{tooltip}</Tooltip>}
    >
      {tag}
    </OverlayTrigger>
  );
}


class MovieLooper extends Component {
  static propTypes = {
    scriptData: PropTypes.array,
    videoURL: PropTypes.string
  }

  constructor (props) {
    super(props);

    const { scriptData, videoURL } = this.props;

    const saved = localStorage.getItem('playingOption');

    // repeatCount - 구간 반복 회수. -1: 무한 반복.
    // pauseRepeat - repeat이 끝난 후 정지 여부. false이면 다음 스크립트로 이동
    // scrollLock - 스크립트 현재 위치 고정 여부. false이면 다음 스크립트로 스크롤
    const options = isundef(saved)
      ? { repeatCount: 10, pauseRepeat: false, scrollLock: false, showScript: false }
      : JSON.parse(saved);

    this.state = {
      videoURL: videoURL,
      scriptData,
      resolution: { width: 0, height: 0 },
      currentTime: 0, // 현재 재생 중인 동영상 위치 (초)
      duration: '00:00:00.000', // 동영상 전체 시간
      volume: 100,
      playing: { running: false }, // 현재 실행 정보
      options
    };

    this._videoDiv = React.createRef();
    this._scriptDiv = React.createRef();

    this._playTimeChecker = null;
  }

  componentDidMount () {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount () {
    this.clearChecker();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  clearChecker = () => {
    if( isvalid(this._playTimeChecker) ) {
      clearInterval(this._playTimeChecker);
      this._playTimeChecker = null;
    }
  }

  keepOptions = () => {
    localStorage.setItem('playingOption', JSON.stringify(this.state.options));
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
        playing.index = playing.index + 1;
        playing.data = scriptData[playing.index];
        playing.start = playing.data.start;
        playing.end = playing.data.end;
        playing.count = 0;

        v.currentTime = Math.max(0, playing.start - 0.2);
        v.play();

        if( !istrue(scrollLock) ) {
          const scDiv = this._scriptDiv.current;
          const rowHeight = 32; // ScriptItem의 높이임.

          scDiv.scrollTop = Math.max(0, rowHeight * playing.index - (scDiv.clientHeight - rowHeight) / 2);
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

  handleVolumeChange = (type, value) => {
    const v = this._videoDiv.current;

    if( 'updown' === type ) {
      v.volume = value / 100.0;
      v.muted = false;
      this.setState({ volume: value });
    } else {
      v.muted = true;
    }
  }

  onControl = (type) => () => {
    const { playing, options } = this.state; // , scriptData, options
    const { repeatCount, pauseRepeat, scrollLock, showScript } = options;

    const v = this._videoDiv.current;

    if( type === 'play/pause' ) {
      type = istrue(playing.running) ? 'pause' : 'play';
    }

    // console.log('onControl', type, JSON.stringify(playing));

    let optUpdate = true;

    switch( type ) {
      case 'pause':
        v.pause();
        playing.running = false;
        optUpdate = false;
        this.setState({ playing: playing });
        break;

      case 'play':
        optUpdate = false;
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
        break;

      case 'scroll':
        options.scrollLock = !scrollLock;
        break;

      case 'repeat':
        options.pauseRepeat = !pauseRepeat;
        break;

      case 'r-up':
        options.repeatCount = Math.min(repeatCount + 1, 20);
        break;

      case 'r-down':
        options.repeatCount = Math.max(repeatCount - 1, 1);
        break;

      default:
        optUpdate = false;
        break;
    }

    if( optUpdate ) {
      this.setState({ options: options });
      this.keepOptions();
    }
  }

  handleKeyDown = (ev) => {
    const { playing, scriptData, volume } = this.state;
    const { keyCode, shiftKey } = ev;

    // console.log('KeyDown', keyCode, ctrlKey, shiftKey);

    switch( keyCode ) {
      case 32: // space-bar --> play/pause
        this.onControl('play/pause')();
        break;

      case 37: // left --> previous script
        this.procScriptLooping( isundef(playing.index) ? 0 : Math.max(0, playing.index - 1) );
        break;

      case 39: // right --> next script
        this.procScriptLooping( isundef(playing.index) ? 0 : Math.min(scriptData.length - 1, playing.index + 1) );
        break;

      case 38: // up
        if( shiftKey ) {
          // increase repeat count
        } else {
          // volume up
          this.handleVolumeChange( 'updown', Math.min(volume + 5, 100) );
        }
        break;

      case 40: // down
        if( shiftKey ) {
          // decrease repeat count
        } else {
          // volume down
          this.handleVolumeChange( 'updown', Math.max(volume - 5, 0) );
        }
        break;

      default:
        break;
    }
  }

  render() {
    const { videoURL, resolution, scriptData, playing, options, currentTime, duration, volume } = this.state;
    const { showScript, scrollLock, pauseRepeat, repeatCount } = options;

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

          <div className="RepeatIcon">
            <div className="ButtonAdjust"><RiRepeatLine size="16" /></div>
          </div>
          { attachTooltip('반복회수',
            <div className="RepeatBox">
              <div className="ButtonAdjust">{repeatCount}</div>
            </div>
          )}

          { attachTooltip('반복회수 올림',
            <div className="ControlButton" onClick={this.onControl('r-up')}>
              <RiArrowUpLine className="ButtonAdjust" size="18" />
            </div>
          )}

          { attachTooltip('반복회수 내림',
            <div className="ControlButton" onClick={this.onControl('r-down')}>
              <RiArrowDownLine className="ButtonAdjust" size="18" />
            </div>
          )}

          <div className="ControlSeparator">&nbsp;</div>
          { attachTooltip('반복상태', <div className="RepeatInfo">{`${nvl(playing.count, -1) + 1} / ${repeatCount}`}</div>) }

          <div className="ControlSeparator">&nbsp;</div>
          { attachTooltip('재생상태', <div className="PlayingTime">{`${secToTime(currentTime)} / ${duration}`}</div>) }

          <div className="ControlSeparator">&nbsp;</div>
          { attachTooltip(playing.running ? '일시중지' : '재생',
            <div className="ControlButton" onClick={this.onControl('play/pause')}>
              { playing.running ? <RiPauseFill className="ButtonAdjust" size="16" /> : <RiPlayFill className="ButtonAdjust" size="18" /> }
            </div>
          )}

          { attachTooltip(showScript ? '전체 자막 가리기' : '전체 자막 보이기',
            <div className="ControlButton" onClick={this.onControl('show')}>
              { showScript ? <RiEyeOffLine className="ButtonAdjust" size="16" /> : <RiEyeLine className="ButtonAdjust" size="16" /> }
            </div>
          )}

          { attachTooltip(scrollLock ? '자막 스크롤 고정' : '자막 자동 스크롤',
            <div className="ControlButton" onClick={this.onControl('scroll')}>
              { scrollLock ? <RiLockLine className="ButtonAdjust" size="16" /> : <RiLockUnlockLine className="ButtonAdjust" size="16" /> }
            </div>
          )}

          { attachTooltip(pauseRepeat ? '현재 자막만 재생' : '다음 자막 자동재생',
            <div className="ControlButton" onClick={this.onControl('repeat')}>
              { pauseRepeat ? <CgPushRight className="ButtonAdjust" size="18" /> : <CgArrowLongRightL className="ButtonAdjust" size="18" /> }
            </div>
          )}

          <div className="ControlSeparator">&nbsp;</div>

          { attachTooltip('음량조절',
            <div className="ControlItem">
              <VolumeControl value={volume} onChange={this.handleVolumeChange} />
            </div>
          )}

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
