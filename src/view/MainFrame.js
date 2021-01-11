import React from 'react';
import './MainFrame.css';



class MainFrame extends React.Component {
	constructor (props) {
    super(props);

    this.state = {
      videoSource: ''
    };
  }

  onVideoChanged = (ev) => {
    const $this = ev.target;
    const files = $this.files;

    console.log('onVideoChanged', $this, files, files[0], URL.createObjectURL(files[0]));
    
    this.setState({ videoSource: URL.createObjectURL(files[0]) });
  }

  render() {
    const { videoSource } = this.state;

  	return (
  		<div className="MainView">
        <div>
          <input type="file" accept="video/*" onChange={this.onVideoChanged} />
        </div>
        <div className="MovieBox">
          <video width="810" src={videoSource} controls autoPlay />
          <div className="MovieOverlay">TEST MESSAGE</div>
        </div>
  		</div>
  	);
  }
}

export default MainFrame;
export { MainFrame };
