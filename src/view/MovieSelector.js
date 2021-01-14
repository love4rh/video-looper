import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { isundef, nvl } from '../common/tool.js';

import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

import './styles.scss';


class MovieSelector extends Component {
  static propTypes = {
    scriptFile: PropTypes.object,
    videoFile: PropTypes.object,

    onGo: PropTypes.func
  }

  constructor (props) {
    super(props);

    const { scriptFile, videoFile } = this.props;

    const scriptURL = null;
    const videoURL = null;
    const sourceType = 'local'; // url 버전은 조금 생각해 봅시다.

    this.state = {
      scriptFile, videoFile,
      scriptURL, videoURL,
      sourceType
    };
  }

  onVideoChanged = (ev) => {
    const $this = ev.target;
    const files = $this.files;

    if( files && files.length > 0 ) {
      this.setState({ videoFile: files[0] });
    } else {
      this.setState({ videoFile: null });
    }
  }

  onScriptFileChanged = (ev) => {
    const $this = ev.target;
    const files = $this.files;

    if( files && files.length > 0 ) {
      this.setState({ scriptFile: files[0] });
    } else {
      this.setState({ scriptFile: null });
    }
  }

  onVideoURLChanged = (ev) => {
    this.setState({ videoURL: ev.target.value });
  }

  onScriptURLChanged = (ev) => {
    this.setState({ scriptURL: ev.target.value });
  }

  handleGo = () => {
    const { onGo } = this.props;
    const { sourceType, scriptFile, videoFile, scriptURL, videoURL } = this.state;
    
    if( onGo ) {
      if( sourceType === 'local' ) {
        onGo(sourceType, videoFile, scriptFile);
      } else {
        onGo(sourceType, videoURL, scriptURL);
      }
    }
  }

  render() {
    const { scriptFile, videoFile, scriptURL, videoURL, sourceType } = this.state;

    return (
      <div className="MovieSelectBox" onClick={this.handleClick}>
        <Form className="MovieOptionBox">
          <div className="FileBoxStyle">
            <Form.Label className="FormTitle">Movie</Form.Label>
            { sourceType === 'local' &&
              <Form.File id="id-file-movie" custom>
                <Form.File.Input isValid onChange={this.onVideoChanged} accept="video/*" />
                <Form.File.Label data-browse="...">
                  { isundef(videoFile) ? 'Input Move File' : videoFile.name }
                </Form.File.Label>
              </Form.File>
            }
            { sourceType === 'url' &&
              <Form.Control
                id="id-url-movie"
                type="text"
                placeholder="Movie URL here..."
                value={nvl(videoURL, '')}
                onChange={this.onVideoURLChanged}
              />
            }
          </div>

          <div className="FileBoxStyle">
            <Form.Label className="FormTitle">Script</Form.Label>
            { sourceType === 'local' &&
              <Form.File id="id-file-script" custom>
                <Form.File.Input isValid onChange={this.onScriptFileChanged} />
                <Form.File.Label data-browse="...">
                  { isundef(scriptFile) ? 'Input Script File' : scriptFile.name }
                </Form.File.Label>
              </Form.File>
            }
            { sourceType === 'url' &&
              <Form.Control
                id="id-url-script"
                type="text"
                placeholder="Script(SRT) URL here..."
                value={nvl(scriptURL, '')}
                onChange={this.onScriptURLChanged}
              />
            }
          </div>

          <div className="GoButtonBox">
            <Button
              disabled={ (sourceType === 'local' && (isundef(scriptFile) || isundef(videoFile))) || (sourceType === 'url' && (isundef(scriptURL) || isundef(videoURL))) }
              className="GoButton"
              variant="primary"
              onClick={this.handleGo}
            >
              Go
            </Button>
          </div>
        </Form>
      </div>
    );
  }
}

export default MovieSelector;
export { MovieSelector} ;
