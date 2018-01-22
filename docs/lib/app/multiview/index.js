import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getColorMap,
    getSampleKinds,
    getAttributes,
    AddData,
    handleColorChange,
    updateSelectedSamples,
} from './actions/dataActions';

import {
    AddDelSamples,
    changeSampleColor,
    setAttr
} from './actions/visActions';

import {Layout, Panel, NavDrawer} from 'react-toolbox/lib/layout';
import {AppBar} from 'react-toolbox/lib/app_bar';
import Button from 'react-toolbox/lib/button';


import {
    ConfigBox,
    ScatterBox
} from './layout';


import theme from './index.css';
import get from 'lodash.get';

class MultiViewApp extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
            height: 0,
        }
    }

    componentWillMount() {
        this.handleResize();
    }

    componentDidMount() {
        this.props.getSampleKinds();
        this.props.getAttributes();
        this.props.getColorMap();

        window.addEventListener("resize", () => this.handleResize());
    }

    componentWillUnmount() {
        window.removeEventListener("resize", () => this.handleResize());
    }

    shouldComponentUpdate(nextProps) {
        // if (nextProps.isDataLoading)
        //     return false;
        return true;
    }

    handleResize = () => {
        let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        width = width;
        height = height - 41.6;// - 56.81;// - 4.15;

        this.setState({width, height});
    }

    handleSampleChange = (action, keys) => {
        this.props.AddDelSamples(action, keys);

        const sampleNames = keys.map(key => this.props.sampleKinds[key]);
        this.props.AddData(action, sampleNames);
    }

    handleAttrChange = (dim, value) => {
        if (value.length === 0) return;
        const {
            attr,
            attrFormat,
            attrKinds
        } = this.props;

        const oldAttr = attrFormat(get(attr, dim));
        if (value !== oldAttr && this.props.setAttr) {
            const attrKeys = Object.keys(attrKinds);
            const index = attrKeys.findIndex(key => key.includes(value));
            //console.log(attrKinds[attrKeys[index]])
            this.props.setAttr(dim, attrKeys[index]);
        }
    }

    handleToolChange = (toolid) => {
        this.setState({toolSelected: toolid});
    }

    handleSampleUpdate = (doUpdate, selected, colors) => {
        if (doUpdate && this.props.updateSelectedSamples) {
            this.props.updateSelectedSamples(selected, colors);
        }
        this.setState({showDataDialog: !this.state.showDataDialog});        
    }

    onToggleDataDialog = () => {
        this.setState({showDataDialog: !this.state.showDataDialog});
    }

    render() {
        const {width, height} = this.state;

        const scatterBoxWidth = Math.min(Math.floor(0.6 * width), Math.floor(height));
        const scatterBoxStyle = {
            width: scatterBoxWidth,
            float: 'left'
        };
        const configBoxStyle = {
            marginLeft: scatterBoxWidth
        };

        return (
            <Layout>
                <Panel>
                    <AppBar title='React-MultiView' leftIcon='menu' onLeftIconClick={null} theme={theme} fixed flat />
                </Panel>

                <div className={theme.chartbox}>
                    <div style={{width: scatterBoxWidth, float: 'left'}}>
                        <ScatterBox width={scatterBoxWidth} height={scatterBoxWidth} />
                    </div>
                    <div style={{marginLeft: scatterBoxWidth}}>
                        <ConfigBox height={height}/>
                    </div>
                </div>
            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleKinds: state.data.sampleKinds,
        sampleColors: state.data.sampleColors,
        sampleColorOpacity: state.data.sampleColorOpacity,
        sampleSelected: state.data.samples,
        attrKinds: state.data.attrKinds,
        attrFormat: state.data.attrFormat,

        attr: {
            x: state.vis.attrx,
            y: state.vis.attry,
            z: state.vis.attrz
        },

        isDataLoading: state.data.numQueried > 0,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getSampleKinds,
        getAttributes,
        AddData,
        setAttr,
        AddDelSamples,
        //changeSampleColor,
        handleColorChange,
        updateSelectedSamples,
        getColorMap
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiViewApp);
