import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { isundef } from '../common/tool.js';

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

    this.state = {
      scriptFile, videoFile
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

  handleGo = () => {
    const { onGo } = this.props;
    
    if( onGo ) {
      const { scriptFile, videoFile } = this.state;
      onGo(videoFile, scriptFile);
    }
  }

  render() {
    const { scriptFile, videoFile } = this.state;

    return (
      <div className="MovieSelectBox" onClick={this.handleClick}>
        <Form className="MovieOptionBox">
          <div className="FileBoxStyle">
            <Form.Label className="FormTitle">Movie</Form.Label>
            <Form.File id="id-file-movie" custom>
              <Form.File.Input isValid onChange={this.onVideoChanged} accept="video/*" />
              <Form.File.Label data-browse="...">
                { isundef(videoFile) ? 'Input Move File' : videoFile.name }
              </Form.File.Label>
            </Form.File>
          </div>

          <div className="FileBoxStyle">
            <Form.Label className="FormTitle">Script</Form.Label>
            <Form.File id="id-file-script" custom>
              <Form.File.Input isValid onChange={this.onScriptFileChanged} />
              <Form.File.Label data-browse="...">
                { isundef(scriptFile) ? 'Input Script File' : scriptFile.name }
              </Form.File.Label>
            </Form.File>
          </div>

          <div className="GoButtonBox">
            <Button
              disabled={isundef(scriptFile) || isundef(videoFile)}
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
