import React from 'react';

import { BsList } from 'react-icons/bs';

import Spinner from 'react-bootstrap/Spinner'
import Toast from 'react-bootstrap/Toast'

import { isvalid, readTextFile} from '../common/tool.js';

import { srtTool } from '../common/srtTool.js';

import { MovieSelector } from '../view/MovieSelector.js';
import { MovieLooper } from '../view/MovieLooper.js';

import './styles.scss';



class MainFrame extends React.Component {
	constructor (props) {
    super(props);

    this.state = {
      pageType: 'select',
      scriptFile: null,
      scriptData: [],
      videoURL: '',
      videoFile: null,
      message: null,
      waiting: false
    };
  }

  componentDidMount() {
    //
  }

  hideToastShow = () => {
    this.setState({ message: null });
  }

  showToastMessage = (msg) => {
    // console.log('showInstanceMessage', msg);
    this.setState({ waiting: false, message: msg });
  }

  handleStart = (vf, sf) => {
    // console.log(vf, JSON.stringify(vf)); 
    
    this.setState({ waiting: true });

    const scriptURL = URL.createObjectURL(sf);

    readTextFile(scriptURL, (text) => {
      this.setState({
        waiting: false,
        pageType: 'study',
        videoFile: vf,
        scriptFile: sf,
        scriptData: srtTool.convert(text.split('\n'))
      });
    });
  }

  render() {
    const { pageType, videoFile, scriptFile, scriptData, waiting, message } = this.state;

    const toastOn = isvalid(message);

  	return (
  		<div className="MainWrap">
        <div className="MainHeader">
          { <div className="MainMenuButton" onClick={this.handleMenu}><BsList size="28" color="#ffffff" /></div> }
          <div className="MainTitle">{'Movie Looper'}</div>
        </div>

        <div className="MainScrollLocked">
          <div className="MainBody">
            { pageType === 'select' && <MovieSelector videoFile={videoFile} scriptFile={scriptFile} onGo={this.handleStart} /> }
            { pageType === 'study'  && <MovieLooper videoFile={videoFile} scriptData={scriptData} /> }
          </div>
        </div>

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
