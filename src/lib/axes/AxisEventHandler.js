import React from "react";
import PropTypes from "prop-types";

import { select, mouse } from "d3-selection";
import { d3Window, mousePosition } from "../utils";

class AxisEventHandler extends React.Component {
	constructor() {
		super();
		this.state = {
			startPos: null
		};
	}

    handleDragStartMouse = (e) => {
    	e.preventDefault();

    	const { scale } = this.props;
    	const startScale = scale.copy();
    	select(d3Window(this.node))
    		.on("mousemove", this.handleDrag, false)
    		.on("mouseup", this.handleDragEnd, false);

    	const startXY = mousePosition(e);
    	this.setState({
    		startPos: {
    			startXY,
    			startScale
    		}
    	});
    }

    handleDrag = () => {
    	const { startPos } = this.state;

    	this.dragHappened = true;
    	if (startPos) {
    		const { startScale, startXY } = startPos;
    		const { getMouseDelta, getInverted } = this.props;
    		const mouseXY = mouse(this.node);
    		const diff = getMouseDelta(startXY, mouseXY);

    		const SCALE_FACTOR = 0.005;
    		const zoomFactor = Math.max(Math.min(1 + diff * SCALE_FACTOR, 3), 0.1);
    		const center = getInverted(startScale, startXY),
    			begin = startScale.domain()[0],
    			end = startScale.domain()[1];

    		const newDomain = [
    			center - (center - begin) * zoomFactor,
    			center + (end - center) * zoomFactor
    		];

    		if (this.props.onDomainChange) {
    			this.props.onDomainChange(newDomain);
    		}
    	}
    }

    handleDragEnd = () => {
    	select(d3Window(this.node))
    		.on("mousemove", null)
    		.on("mouseup", null);

    	this.setState({
    		startPos: null
    	});
    }

    render() {
    	const cursor = this.state.startPos
    		? this.props.zoomCursorClassName
    		: "react-multiview-default-cursor";

    	return <rect
    		ref={node => this.node = node}
    		className={`react-multiview-enable-interaction ${cursor}`}
    		x={this.props.x}
    		y={this.props.y}
    		width={this.props.width}
    		height={this.props.height}
    		style={{ fill: "green", opacity: 0. }}
    		onMouseDown={this.handleDragStartMouse}
    	/>;
    }
}

AxisEventHandler.propTypes = {
	scale: PropTypes.func,
	getMouseDelta: PropTypes.func,
	getInverted: PropTypes.func,
	onDomainChange: PropTypes.func,
	zoomCursorClassName: PropTypes.string,
	x: PropTypes.number,
	y: PropTypes.number,
	width: PropTypes.number,
	height: PropTypes.number
};
AxisEventHandler.defaultProps = {};

export default AxisEventHandler;
