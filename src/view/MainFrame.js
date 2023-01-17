import React from 'react';

// import { BsList } from 'react-icons/bs';
import { RiArrowGoBackFill } from 'react-icons/ri';

import Spinner from 'react-bootstrap/Spinner'
import Toast from 'react-bootstrap/Toast'

import { isvalid, readTextFile, istrue } from '../common/tool.js';

import { scriptTool } from '../common/scriptTool.js';

import { VideoSelector } from './VideoSelector.js';
import { VideoLooper } from '../view/VideoLooper.js';

import { idbKeyval } from '../common/idbKeyval';

import { getScriptMock } from '../mock/scriptMock.js';

import './styles.scss';


const debugOn = false;


class MainFrame extends React.Component {
	constructor (props) {
    super(props);

    const lastOne = localStorage.getItem('lastScript');

    this.state = {
      pageType: 'select', // select, study
      scriptFile: null,
      scriptData: [],
      videoURL: '',
      videoFile: null,
      message: null,
      hasLastScript: isvalid(lastOne),
      waiting: false
    };
  }

  componentDidMount() {
    idbKeyval.get('video-file', (vf) => {
      // console.log('Last Video File:', vf);
      if( isvalid(vf) ) {
        this.setState({ videoFile: vf });
      }
    });
  }

  hideToastShow = () => {
    this.setState({ message: null });
  }

  showToastMessage = (msg) => {
    this.setState({ waiting: false, message: msg });
  }

  // islast: 마지막 스크립트 사용 여부
  goToStudy = (vUrl, vFile, sData, sFile, islast) => {
    const newState = {
      waiting: false,
      pageType: 'study',
      videoURL: vUrl,
      scriptData: sData
    };

    if( vFile ) {
      newState.videoFile = vFile;
    }

    if( sFile ) {
      newState.scriptFile = sFile;
    }

    if( !istrue(islast) ) {
      localStorage.setItem('stat', '{}');
    }

    this.setState(newState);
  }

  handleStart = (type, vf, sf) => {
    // console.log(vf, JSON.stringify(vf)); 
    this.setState({ waiting: true });

    idbKeyval.set('video-file', vf);

    if( sf === '$last$' ) {
      const saved = JSON.parse(localStorage.getItem('lastScript'));

      if( type === 'local' ) {
        this.goToStudy(URL.createObjectURL(vf), vf, saved.script, null, true);
      } else {
        this.goToStudy(vf, null, saved.script, null, true);
      }
      return;
    }

    readTextFile(sf, (text) => {
      let scriptData = null;

      if( debugOn ) {
        scriptData = getScriptMock();
      } else if( sf.name.endsWith('.json') ) {
        scriptData = JSON.parse(text);
        if( !scriptTool.isValidScript(scriptData) ) {
          this.showToastMessage('이 앱에서 사용하는 자막 데이터가 아닙니다.');
          return;
        }
        scriptData = scriptData.script;
      } else if( sf.name.endsWith('.srt') ) {
        scriptData = scriptTool.convert(text.split('\n'));
      } else {
        this.showToastMessage('지원하지 않는 자막 포맷입니다.');
        return;
      }

      localStorage.setItem('lastScript', JSON.stringify({ script:scriptData }));

      if( type === 'local' ) {
        this.goToStudy(URL.createObjectURL(vf), vf, scriptData, sf);
      } else {
        this.goToStudy(vf, null, scriptData, null);
      }
    });
  }

  handleClickMenu = (type) => () => {
    if( 'main' === type ) {
      this.setState({ pageType: 'select' });
    }
  }

  render() {
    const {
      pageType, videoFile, scriptFile, scriptData,
			waiting, message, videoURL, hasLastScript
		} = this.state;

    const toastOn = isvalid(message);

  	return (
  		<div className="MainWrap">
        { pageType === 'select' && <VideoSelector videoFile={videoFile} scriptFile={scriptFile} canUseLast={hasLastScript} onGo={this.handleStart} /> }
        { /* TODO 메인 메뉴로 빽했을 때 VideoLooper가 살아 있는 현상이 있음. */ }
        { pageType === 'study' &&
          <VideoLooper onGoBack={this.handleClickMenu('main')} videoURL={videoURL} scriptData={scriptData} videoID={isvalid(videoFile) ? videoFile.name : videoURL} />
        }

        { waiting &&
          <div className="BlockedLayer">
            <Spinner className="SpinnerBox" animation="border" variant="primary" />
          </div>
        }
        { toastOn &&
          <div className="BlockedLayer" onClick={this.hideToastShow}>
            <Toast className="ToastBox" onClose={this.hideToastShow} show={toastOn} delay={3000} autohide animation>
              <Toast.Header>
                <strong className="mr-auto">Message</strong>
              </Toast.Header>
              <Toast.Body>{message}</Toast.Body>
            </Toast>
          </div>
        }
  		</div>
  	);
  }
}

export default MainFrame;
export { MainFrame };
