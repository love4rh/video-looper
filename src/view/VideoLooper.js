import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Form from 'react-bootstrap/Form';

import {
  RiPlayFill, RiPauseFill, RiEyeLine, RiEyeOffLine, RiLockLine, RiLockUnlockLine, RiArrowGoBackFill
} from 'react-icons/ri';

import { CgPushRight, CgArrowLongRightL, CgTranscript, CgOptions } from 'react-icons/cg';
import { MdTimerOff, MdTimer, MdSpeakerNotes, MdSpeakerNotesOff } from 'react-icons/md';
import { BsCircle, BsDashCircle } from 'react-icons/bs';

import { isundef, isvalid, istrue, secToTime, nvl } from '../common/tool.js';

import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

// import { TooltipEx } from '../view/TooltipEx.js';
import { ScriptItem } from './ScriptItem.js';
import { VolumeControl } from './VolumeControl.js';

import './styles.scss';


// 시작 위치 조정값 (sec)
const _adjStart = 0.2;
const toolTipOn = false;

const attachTooltip = (tooltip, tag) => {
  if( !toolTipOn ) {
    return tag;
  }

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{tooltip}</Tooltip>}
    >
      {tag}
    </OverlayTrigger>
  );
}


class VideoLooper extends Component {
  static propTypes = {
    scriptData: PropTypes.array,
    videoID: PropTypes.string,
    videoURL: PropTypes.string
  }

  constructor (props) {
    super(props);

    const { scriptData, videoURL } = this.props;

    const saved = localStorage.getItem('playingOption');

    // repeatCount: 구간 반복 회수. -1: 무한 반복.
    // pauseRepeat: repeat이 끝난 후 정지 여부. false이면 다음 스크립트로 이동
    // scrollLock: 스크립트 현재 위치 고정 여부. false이면 다음 스크립트로 스크롤
    // simpleMenu: 심플 메뉴모드. true이면 필요한 것들만 표시함
    // speakingTime: 말하기 시간 주기 여부
    const optionBasic = {
      repeatCount: 10, pauseRepeat: false, scrollLock: false, showScript: false, simpleMenu: true, speakingTime: true,
      hideBottom: false, // 아래 자막 표시되는 영역 가리기
    };
    const options = isundef(saved) ? optionBasic : { ...optionBasic, ...JSON.parse(saved) };

    // 키로 현재 실행 중인 스크립트 내용 show/hide를 쉽게 하기 위한 변수
    options.revealIndex = -1;
    options.showTime = false;

    this.state = {
      videoURL: videoURL,
      scriptData,
      resolution: { width: 0, height: 0 },
      currentTime: 0, // 현재 재생 중인 동영상 위치 (초)
      duration: '00:00:00.000', // 동영상 전체 시간
      volume: 100,
      playing: { running: false }, // 현재 실행 정보
      screenLocked: false, // 화면 기능 잠굼 여부
      options,
      rangingIdx: -1
    };

    this._refVideoBox = React.createRef();
    this._videoDiv = React.createRef();
    this._scriptDiv = React.createRef();

    this._playTimeChecker = null;

    this._lockClickCount = 0;

    const lastIdx = Number(nvl(localStorage.getItem('lastPlayIndex'), '0'));
    const sd = scriptData[lastIdx];
    this.state.playing = { running: false, index: lastIdx, range: null, start: sd.start, end: sd.end, count: 0 }

    // 스크립트 실행 통계
    const s = localStorage.getItem('stat');

    if( isvalid(s) ) {
      this._stat = JSON.parse(s);
    }
  }

  componentDidMount () {
    const { playing } = this.state;
    if( playing.index > 0 ) {
      this.scrollToIndex(playing.index);
      const v = this._videoDiv.current;
      v.currentTime = playing.start;
    }
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount () {
    localStorage.setItem('stat', JSON.stringify(this._stat));
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

  addStat = (idx, type) => {
    if( idx === -1 ) {
      return;
    }

    if( idx in this._stat ) {
      if( 'reveal' === type ) {
        this._stat[idx].reveal += 1;
      } else {
        this._stat[idx].count += 1;
      }
    } else {
      this._stat[idx] = { count: 1, reveal: 0 }; // 재생회수, 자막보기 회수
    }

    localStorage.setItem('lastPlayIndex', idx);
  }

  procTimeChecker = () => {
    const { playing, scriptData, options } = this.state;
    const { repeatCount, pauseRepeat, scrollLock, speakingTime } = options;

    if( isundef(playing) ) {
      return;
    }

    const v = this._videoDiv.current;

    // playing: range(영역 실행 여부 및 실행 영역), index: 현재 플레이 중인 스크립트 인덱스

    // 현재 실행 중인 스크립트 완료 여부 체크
    if( v.currentTime + _adjStart < playing.end ) {
      if( isvalid(playing.range) && v.currentTime > scriptData[playing.index].end ) {
        playing.index = playing.index + 1;
        this.addStat(playing.index);
        this.setState({ playing: playing, currentTime: v.currentTime });
      }
      // 완료 전으로 계속 플레이 함.
      return;
    }

    // 현재 스크립트가 완료된 경우임 --> 플레이 카운트 증가
    playing.count += 1;

    if( playing.count < repeatCount || repeatCount === -1 ) {
      v.pause();
      setTimeout(() => {
        v.currentTime = Math.max(0, playing.start - _adjStart);

        if( isvalid(playing.range) ) {
          playing.index = playing.range[0];
          this.addStat(playing.index);
          this.setState({ playing, currentTime: v.currentTime });
          v.play();
        } else if( speakingTime ) {
          // 단일 스크립트 실행 시 따라 말하기를 위한 시간을 줌
          setTimeout(() => { v.play() }, (playing.end - playing.start) * 1150);
        } else {
          v.play();
        }
      }, 500);
    } else if( !istrue(pauseRepeat) && playing.index < scriptData.length - 1 ) {
      const nIdx = isundef(playing.range) ? playing.index + 1 : playing.range[0];
      const sd = scriptData[nIdx];
      
      playing.index = nIdx;
      playing.start = sd.start;
      playing.end = sd.end;
      playing.count = 0;

      v.currentTime = Math.max(0, playing.start - _adjStart);
      this.addStat(playing.index);
      v.play();

      if( !istrue(scrollLock) ) {
        this.scrollToIndex(playing.index);
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

  procScriptLooping = (idx, rangeEnd) => {
    const { scriptData } = this.state;
    const v = this._videoDiv.current;

    if( isvalid(rangeEnd) ) {
      const b = idx;
      const e = rangeEnd;

      const db = scriptData[b];
      const de = scriptData[e];
      v.currentTime = Math.max(0, db.start - _adjStart);

      this.addStat(b);
      this.setState({
        currentTime: v.currentTime,
        rangingIdx: -1,
        playing: { running: true, index: b, range:[b, e], start: db.start, end: de.end, count: 0 }
      });
    } else {
      const sd = scriptData[idx];
      v.currentTime = Math.max(0, sd.start - _adjStart);

      this.addStat(idx);
      this.setState({
        currentTime: v.currentTime,
        rangingIdx: -1,
        playing: { running: true, index: idx, range: null, start: sd.start, end: sd.end, count: 0 }
      });
    }

    if( v.paused ) {
      v.play();
    }
  }

  scrollToIndex = (idx) => {
    const scDiv = this._scriptDiv.current;
    const rowHeight = 32; // ScriptItem의 높이임.

    scDiv.scrollTop = Math.max(0, rowHeight * idx - (scDiv.clientHeight - rowHeight) / 2);
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

  handleScriptClick = (idx) => (type) => {
    if( this.state.screenLocked ) {
      return;
    }

    // TODO 현재 실행 중인 스크립트가 idx라면 play/pause 토글
    if( 'range' === type ) {
      const { rangingIdx } = this.state;
      if( idx === rangingIdx ) {
        this.setState({ rangingIdx: -1 });
      } else if( rangingIdx === -1 ) {
        this.setState({ rangingIdx: idx });
      } else {
        this.procScriptLooping(Math.min(idx, rangingIdx), Math.max(idx, rangingIdx));
      }
    } else {
      this.procScriptLooping(idx);
    }
    
  }

  handleVideoPlay = () => {
    if( isundef(this._playTimeChecker) ) {
      this._playTimeChecker = setInterval(this.procTimeChecker, 100);
    }
  }

  handleVideoPause = () => {
    this.clearChecker();
  }

  handleVolumeChange = (type, value) => {
    if( this.state.screenLocked ) {
      return;
    }

    const v = this._videoDiv.current;

    if( 'updown' === type ) {
      v.volume = value / 100.0;
      v.muted = false;
      this.setState({ volume: value });
    } else {
      v.muted = true;
    }
  }

  handleRepeatCount = (ev) => {
    const { options, screenLocked } = this.state; // , scriptData

    if( screenLocked ) {
      return;
    }

    options.repeatCount = parseInt(ev.target.value);

    this.setState({ options: options });
    this.keepOptions();
  }

  onControl = (type) => () => {
    const { scriptData, playing, options, screenLocked } = this.state; // , scriptData
    const { repeatCount, pauseRepeat, scrollLock, showScript, revealIndex, showTime, simpleMenu, speakingTime, hideBottom } = options;

    if( screenLocked && type !== 'screenLock' ) {
      return;
    }

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
          if( Math.abs(playing.end - v.currentTime) < 500 ) {
            v.currentTime = scriptData[isundef(playing.range) ? playing.index : playing.range[0]].start - _adjStart;
          }
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

      case 'reveal':
        options.revealIndex = isvalid(playing.index) && playing.index !== revealIndex ? playing.index : -1;
        this.addStat(options.revealIndex, 'reveal');
        break;

      case 'time':
        options.showTime = !showTime;
        break;

      case 'simpleMenu':
        options.simpleMenu = !simpleMenu;
        break;

      case 'speaking':
        options.speakingTime = !speakingTime;
        break;

      case 'screenLock':
        this._lockClickCount += 1;
        if( this._lockClickCount === 1 ) {
          setTimeout(() => this._lockClickCount = 0, 2000);
        }

        if( this._lockClickCount >= 3 ) {
          this._lockClickCount = 0;
          this.setState({ screenLocked: !screenLocked });
        }
        optUpdate = false;
        break;

      case 'bottom':
        options.hideBottom = !hideBottom;
        optUpdate = true;
        break;

        // eslint-disable-next-line 
      default:
        optUpdate = false;
        break;
    }

    if( optUpdate ) {
      this.setState({ options: options });
      this.keepOptions();
    }
  }

  adjustScriptStartTime = (idx, tm, all) => {
    if( isundef(idx) ) {
      return;
    }

    const { scriptData } = this.state;

    // idx(포함) 이후 전체 대상
    if( istrue(all) ) {
      for(let i = idx; i < scriptData.length; ++i) {
        scriptData[i].start += tm;
        scriptData[i].end += tm;
      }
      this.setState({ scriptData: scriptData });
    } else {
      scriptData[idx].start += tm;
      scriptData[idx].end += tm;
      this.setState({ scriptData: scriptData });

      this.procScriptLooping(idx);
    }

    localStorage.setItem('lastScript', JSON.stringify({ script:scriptData }));
  }

  adjustScriptDuratoin = (idx, tm) => {
    if( isundef(idx) ) {
      return;
    }

    const { scriptData } = this.state;

    scriptData[idx].end += tm;

    this.setState({ scriptData: scriptData });
    this.procScriptLooping(idx);

    localStorage.setItem('lastScript', JSON.stringify({ script:scriptData }));
  }

  // idx의 스크립트를 idx - 1 번째 것으로 합치기
  mergeScriptUp = (idx) => {
    if( idx <= 0 ) {
      return;
    }

    const { scriptData } = this.state;

    const newData = idx === 1 ? [] : scriptData.slice(0, idx - 1);

    const ms = scriptData[idx - 1];
    const ns = scriptData[idx];

    ms.start = Math.min(ms.start, ns.start);
    ms.end = Math.max(ms.end, ns.end);
    ms.text += (' ' + ns.text);

    newData.push(ms);

    // idx 이후 거 추가
    if( idx < scriptData.length - 1 ) {
      scriptData.slice(idx + 1).map((d) => {
        d.idx -= 1;
        newData.push(d);
        return d;
      });
    }

    // console.log('new Script', newData.length, newData);
    this.setState({ scriptData: newData });

    localStorage.setItem('lastScript', JSON.stringify({ script:newData }));
  }

  // 파일로 데이터 저장
  downloadScript = () => {
    const { scriptData } = this.state;

    const data = new Blob([JSON.stringify({ script: scriptData })], { type: 'text/plain' });
    const tempLink = document.createElement('a');

    tempLink.href = URL.createObjectURL(data);
    tempLink.setAttribute('download', 'script.json');
    tempLink.click();
  }

  handleKeyDown = (ev) => {
    const { playing, scriptData, volume, screenLocked } = this.state;
    const { keyCode, shiftKey, ctrlKey } = ev;

    if( screenLocked ) {
      if( ev.preventDefault ) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      return;
    }

    const adjTime = 0.15;
    // console.log('KeyDown', keyCode, ctrlKey, shiftKey);

    let processed = true;

    switch( keyCode ) {
      case 32: // space-bar --> play/pause
        this.onControl('play/pause')();
        break;

      case 188: // <(,)
        if( shiftKey ) {
          // 현재 자막 유지 시간 adjTime초 감소
          this.adjustScriptDuratoin(playing.index, -adjTime);
        } else {
          // 현재 자막 시작 시간 adjTime초 감소
          this.adjustScriptStartTime(playing.index, -adjTime, ctrlKey);
        }
        break;

      case 190: // >(.)
        if( shiftKey ) {
          // 현재 자막 유지 시간 adjTime초 증가
          this.adjustScriptDuratoin(playing.index, adjTime);
        } else {
          // 현재 자막 시작 시간 adjTime초 증가
          this.adjustScriptStartTime(playing.index, adjTime, ctrlKey);
        }
        break;

      case 37: // left
        // volume down
        this.handleVolumeChange( 'updown', Math.max(volume - 5, 0) );
        break;

      case 39: // right
        // volume up
        this.handleVolumeChange( 'updown', Math.min(volume + 5, 100) );
        break;

      case 38: // up
        if( ctrlKey && shiftKey ) {
          this.mergeScriptUp(playing.index);
        } else {
          // previous script
          const nidx = isundef(playing.index) ? 0 : Math.max(0, playing.index - 1);
          this.procScriptLooping(nidx);
          this.scrollToIndex(nidx);
        }
        break;

      case 40: // down
        if( ctrlKey && shiftKey ) {
          this.downloadScript()
        } else {
          // next script
          const nidx = isundef(playing.index) ? 0 : Math.min(scriptData.length - 1, playing.index + 1);
          this.procScriptLooping(nidx);
          this.scrollToIndex(nidx);
        }
        break;

      case 83: // s --> show/hide current script
        this.onControl('reveal')();
        break;

      default:
        processed = false;
        break;
    }

    if( processed && ev.preventDefault ) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  handleClickMenu = (type) => () => {
    if( type === 'main' ) {
      this.onControl('pause');
      setTimeout(() => {
        this.props.onGoBack();
      }, 200);
    }
  }

  render() {
    const { videoURL, scriptData, playing, options, currentTime, duration, volume, rangingIdx, screenLocked } = this.state;
    const { showScript, scrollLock, pauseRepeat, repeatCount, revealIndex, showTime, simpleMenu, speakingTime, hideBottom } = options;

    const vbox = this._refVideoBox.current;
    let vHeight = 100;

    if( isvalid(vbox) ) {
      vHeight = vbox.clientHeight * 0.4;
    }

    // 반복회수 선택 옵션
    const repeatOptions = [-1, 1, 2, 3, 4, 5, 10, 15, 20, 30, 50, 100];

    const vd = this._videoDiv.current;
    let overlayBox = {};

    if( isvalid(vd) ) {
      // const { offsetTop, offsetLeft, clientTop, clientLeft, clientWidth, clientHeight } = vd;
      const oHeight = vHeight * 0.22;
      overlayBox = {
        left: (vd.offsetLeft), width: (vd.clientWidth),
        top: (vd.offsetTop + vd.clientHeight - oHeight), height: oHeight
      };
    }

    return (<>
      <div className="MainHeader">
        <div className="MainTitle">{'Video Repeater'}</div>
        <div className="MainMenuButton" onClick={this.handleClickMenu('main')}><RiArrowGoBackFill size="24" color="#ffffff"/></div>
      </div>
      <div className="MainScrollLocked"><div className="MainBody">
        <div ref={this._refVideoBox} className="MovieViewBox">
          <div className="MovieArea">
            <video ref={this._videoDiv}
              className="MovieDiv"
              style={{ maxHeight:vHeight }}
              onLoadedMetadata={this.onLoadedMetadata}
              src={videoURL}
              onPlay={this.handleVideoPlay}
              onPause={this.handleVideoPause}
            />
            { hideBottom && <div className="MovieOverlay" style={overlayBox}>&nbsp;</div> }
          </div>
          <div className="ControlArea">
            { attachTooltip('반복상태', <div className="RepeatInfo">{`${nvl(playing.count, -1) + 1} / ${repeatCount === -1 ? '∞' : repeatCount}`}</div>) }

            { !simpleMenu && <>
              <div className="ControlSeparator">&nbsp;</div>
              { attachTooltip('재생상태', <div id={`tm-${currentTime}`} className="PlayingTime">{`${secToTime(currentTime)} / ${duration}`}</div>) }
            </>}

            <div className="ControlSeparator">&nbsp;</div>
            { attachTooltip('반복회수',
              <Form.Control
                as="select"
                className="RepeatBox"
                custom
                value={repeatCount}
                onChange={this.handleRepeatCount}
              >
                { repeatOptions.map((n) => <option key={`ropt-${n}`} value={n}>{n === -1 ? '∞' : n }</option>) }
              </Form.Control>
            )}

            { attachTooltip(playing.running ? '일시중지' : '재생',
              <div className="ControlButton" onClick={this.onControl('play/pause')}>
                { playing.running ? <RiPauseFill className="ButtonAdjust" size="16" /> : <RiPlayFill className="ButtonAdjust" size="18" /> }
              </div>
            )}

            { !simpleMenu && <>
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
              { attachTooltip(showTime ? '스크립트 시간 보기' : '스크립트 시간 닫기',
                <div className="ControlButton" onClick={this.onControl('time')}>
                  { showTime ? <MdTimer className="ButtonAdjust" size="18" /> : <MdTimerOff className="ButtonAdjust" size="18" /> }
                </div>
              )}

              <div className="ControlSeparator">&nbsp;</div>

              { attachTooltip('음량조절',
                <div className="ControlItem">
                  <VolumeControl value={volume} onChange={this.handleVolumeChange} />
                </div>
              )}

              <div className="ControlSeparator">&nbsp;</div>
            </>}

            { attachTooltip(hideBottom ? '화면아래 보이기' : '화면아래 가리기',
              <div className="ControlButton" onClick={this.onControl('bottom')}>
                <CgTranscript className="ButtonAdjust" size="18" />
              </div>
            )}

            { attachTooltip(speakingTime ? '말하기 시간 없애기' : '말하기 시간 추가',
              <div className="ControlButton" onClick={this.onControl('speaking')}>
                { speakingTime ? <MdSpeakerNotes className="ButtonAdjust" size="18" /> : <MdSpeakerNotesOff className="ButtonAdjust" size="18" /> }
              </div>
            )}

            { attachTooltip(screenLocked ? '기능 열기' : '기능 잠굼',
              <div className="ControlButton" onClick={this.onControl('screenLock')}>
                { screenLocked ? <BsDashCircle className="ButtonAdjust" size="18" /> : <BsCircle className="ButtonAdjust" size="18" /> }
              </div>
            )}

            { attachTooltip(simpleMenu ? '전체 메뉴 보기' : '필수 메뉴만 모기',
              <div className="ControlButton" onClick={this.onControl('simpleMenu')}>
                <CgOptions className="ButtonAdjust" size="18" />
              </div>
            )}
          </div>

          <div className="ScriptArea">
            <div ref={this._scriptDiv} className="ScriptScroll">
              { scriptData.map((sd, idx) => {
                  const shown = showScript || revealIndex === idx;
                  return (
                    <ScriptItem
                      key={`script-${idx}-${sd.start}-${sd.end}-${shown}`}
                      index={idx}
                      data={sd}
                      selected={playing.index === idx}
                      chained={isvalid(playing.range) && playing.range[0] <= idx && idx <= playing.range[1]}
                      showText={shown}
                      showTime={showTime}
                      ranging={rangingIdx === idx}
                      onClick={this.handleScriptClick(idx)}
                    />
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div></div>
    </>);
  }
}

export default VideoLooper;
export { VideoLooper} ;
