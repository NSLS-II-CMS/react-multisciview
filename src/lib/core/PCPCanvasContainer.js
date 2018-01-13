import React from "react";
import PropTypes from "prop-types";

class PCPCanvasContainer extends React.Component {
	constructor() {
		super();
		this.canvas = {};
	}

    setCanvas = (node) => {
    	if (node) this.canvas[node.id] = node.getContext("2d");
    	else this.canvas = {};
    }

    getCanvas = () => {
    	if (this.canvas.axes) return this.canvas;
    }

    render() {
    	const { width, height, zIndex, ratio } = this.props;

    	const divStyle = {
    		position: "absolute",
    		zIndex: zIndex
    	};

    	const canvasStyle = {
    		position: "absolute",
    		width: width,
    		height: height
    	};
    	const canvasWidth = width * ratio;
    	const canvasHeight = height * ratio;

    	return (
    		<div style={divStyle}>
    			<canvas id="pcpOff" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} />            
    			<canvas id="pcpOn" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} />
    			<canvas id="axes" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} />
    			{/* <canvas id="mouseCoord" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} /> */}
                {/* <canvas id="off" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} /> */}
    		</div>
    	);
    }
}

PCPCanvasContainer.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	zIndex: PropTypes.number,
	ratio: PropTypes.number
};

export default PCPCanvasContainer;
