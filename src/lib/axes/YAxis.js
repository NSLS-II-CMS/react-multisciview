import React from "react";
import PropTypes from "prop-types";

import AxisEventHandler from "./AxisEventHandler";
import {
	drawAxisLine,
	drawTicks
} from "./draw";
import { SubscriberExt } from "../core";

class YAxis extends React.Component {
    getTicks = (yScale) => {
    	const { ticks, tickFormat, innerTickSize, orient } = this.props;
    	const { fontSize } = this.props.labelStyle;
    	//const { yScale } = this.props.chartConfig;

    	const baseFormat = yScale.tickFormat
    		? yScale.tickFormat(ticks)
    		: d => d;

    	const format = tickFormat
    		? d => tickFormat(d) || ""
    		: baseFormat;

    	const tickValues = yScale.ticks(ticks);

    	const sign = orient === "left" || orient === "top" ? -1 : 1;
    	const dx = fontSize * 0.35;

    	return tickValues.map(d => {
    		const y = yScale(d); // Math.round(xScale(d));
    		return {
    			value: d,
    			label: format(d),
    			x1: 0,
    			y1: y,
    			x2: sign * innerTickSize,
    			y2: y,
    			labelX: sign * ( 1.2 * innerTickSize + dx ),
    			labelY: y + dx
    		};
    	});
	}
	
    getTicksOrdinary = (yScale, yExtents, yStep) => {
		const { ticks, tickFormat, innerTickSize, orient } = this.props;
		const { canvasDim:{height} } = this.props.shared;
    	const { fontSize } = this.props.labelStyle;
    	const sign = orient === "left" || orient === "top" ? -1 : 1;
    	const dx = fontSize * 0.35;

		const yLabels = yExtents.slice();
		yLabels.reverse();
		const minval = Math.max(Math.floor(yScale.invert(yScale.range()[0])), 0);
		const maxval = Math.min(Math.ceil(yScale.invert(yScale.range()[1])), yLabels.length);

		const tickArray = [];
		for (let i=minval; i<maxval; ++i) {
			const y = yScale(i) - yStep/2;

			if (y < 0 || y > height) {
				continue;
			}

			tickArray.push({
				value: i,
				label: yLabels[i].length > 13 ? yLabels[i].substring(0, 13) + '...': yLabels[i],
				x1: 0,
				y1: y,
				x2: sign * innerTickSize,
				y2: y,
				labelX: sign * ( 1.2 * innerTickSize + dx),
				labelY: y + dx
			});
		}
		return tickArray;
    }	

    draw = (ctx, moreProps) => {
		const { showDomain, showTicks, showTickLabel } = this.props;
		const { yAttr } = moreProps;
		const {
			scale,
			step,
			ordinary,
			origExtents: extents
		} = yAttr;

    	const axisLocation = this.getAxisLocation();

    	ctx.save();
    	ctx.translate(axisLocation, 0);

    	if (showDomain) {
    		drawAxisLine(ctx, this.props, scale.range());
    	}

    	if (showTicks) {
    		const { orient, labelStyle } = this.props;
			const textAnchor = orient === "left" ? "end" : "start";
			drawTicks(ctx, 
				ordinary ? this.getTicksOrdinary(scale, extents, step): this.getTicks(scale),
    			this.props.tickStyle,
    			showTickLabel ? { ...labelStyle, textAnchor } : null
    		);
    	}

    	ctx.restore();
    }

    getAxisLocation = () => {
        const { axisAt } = this.props;
        const { canvasDim:{width} } = this.props.shared;

    	let axisLocation;
    	switch (axisAt) {
    	case "left": axisLocation = 0; break;
    	case "middle": axisLocation = width / 2; break;
    	case "right": default: axisLocation = width;
    	}

    	return axisLocation;
    }

    getDrawRegion = () => {
        const { axisWidth, orient } = this.props;
        const { canvasDim:{height} } = this.props.shared;

    	const
    		x = (orient === "left") ? -axisWidth : 0,
    		y = 0,
    		w = axisWidth,
    		h = height;

    	return {
    		x,
    		y,
    		width: w,
    		height: h
    	};
    }

    onDomainChange = (newDomain) => {
    	const { handleYAxisZoom } = this.props.shared;

    	if (handleYAxisZoom)
    	 	handleYAxisZoom(newDomain);
    }

    render() {
    	const
    		rect = this.getDrawRegion(),
			axisLocation = this.getAxisLocation(),
			{ yAttr: {scale: yScale} } = this.props.shared;

    	return (
    		<g transform={`translate(${axisLocation},${0})`}>
    			<AxisEventHandler
					{...rect}
					scale={yScale}
					getMouseDelta={this.props.getMouseDelta}
					getInverted={this.props.getInverted}
					onDomainChange={this.onDomainChange}
					zoomCursorClassName={"react-multiview-ns-resize-cursor"}
				/>
    			<SubscriberExt
    				ref={node => this.node = node}
    				canvas={contexts => contexts.axes}
    				clip={false}
    				edgeClip={false}
                    draw={this.draw}
                    drawOn={['pan']}
                    shared={this.props.shared}
    			/>
    		</g>
    	);
    }
}

YAxis.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	axisWidth: PropTypes.number,

	axisAt: PropTypes.oneOfType([
		PropTypes.oneOf(["left", "right", "middle"]),
		PropTypes.number
	]).isRequired,
	orient: PropTypes.oneOf(["left", "right"]).isRequired,

	ticks: PropTypes.number,
	tickFormat: PropTypes.func,

	// for axis line
	outerTickSize: PropTypes.number,
	stroke: PropTypes.string,
	strokeWidth: PropTypes.number,
	opacity: PropTypes.number,

	// for ticks
	innerTickSize: PropTypes.number,
	tickStyle: PropTypes.shape({
		tickStroke: PropTypes.string,
		tickStrokeOpacity: PropTypes.number,
		tickStrokeWidth: PropTypes.number
	}),

	labelStyle: PropTypes.shape({
		fontSize: PropTypes.number,
		fontFamily: PropTypes.string,
		textAnchor: PropTypes.string,
		tickLabelFill: PropTypes.string,
	}),

	showTicks: PropTypes.bool,
	showTickLabel: PropTypes.bool,
	showDomain: PropTypes.bool,

	className: PropTypes.string,
	domainClassName: PropTypes.string,

	zoomEnabled: PropTypes.bool,
	getMouseDelta: PropTypes.func,
	// onContextMenu: PropTypes.func,
	// onDoubleBlick: PropTypes.func,
};

YAxis.defaultProps = {
	ticks: 10,

	outerTickSize: 0,
	stroke: "#000000",
	strokeWidth: 1,
	opacity: 1,

	innerTickSize: 5,
	tickStyle: {
		tickStroke: "#000000",
		tickStrokeOpacity: 1,
		tickStrokeWidth: 1
	},

	labelStyle: {
		fontSize: 6,
		fontFamily: "Roboto, sans-serif",
		textAnchor: "start",
		tickLabelFill: "#000000"
	},

	showTicks: true,
	showTickLabel: true,
	showDomain: true,

	className: "",
	domainClassName: "",

	// tickPadding: 6,
	// tickStroke: '#000000',
	// tickStrokeOpacity: 1,

	// fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
	// fontSize: 12,

	// xZoomHeight: 25,
	zoomEnabled: true,
	getMouseDelta: (startXY, mouseXY) => startXY[1] - mouseXY[1],
	getInverted: (scale, XY) => scale.invert(XY[1])

	// fill: 'none',
};

export default YAxis;
