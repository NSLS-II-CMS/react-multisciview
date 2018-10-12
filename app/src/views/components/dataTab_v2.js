import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import axios from "axios";

import Autocomplete from "react-toolbox/lib/autocomplete";
import { Button } from "react-toolbox/lib/button";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import { Dropdown } from "react-toolbox";
import theme from "./index.css"

import { sortAlphaNum } from "../../utils";
import { hexToRGBA } from "react-multiview/lib/utils";

import {
    get_data,
    del_data,
    changeSelectedSampleColors,
    setValue
} from "../../actions/dataActions";

import {
    getSelectedSamples,
    getSelectedSamplesCounts
} from "../../selectors";


const DataListItem = (props) => {
	const { id, name, color, onColorChange, onItemDelete, count } = props;
    const leftBtnStyle = { 
        minWidth: "10px", maxHeight: "10px", 
        backgroundColor: color ? color : "#000000" 
    };
	const rightBtnStyle = { minWidth: "10px" };
	return <ListItem theme={theme}
		caption={name}
        leftActions={[
            <Button key={`btn-l-${id}`} raised style={leftBtnStyle} 
                    onClick={() => onColorChange([name])}/>
        ]}
		rightActions={[
            <b>{count}</b>,                           
            <Button key={`btn-r-${id}`} icon="delete" style={rightBtnStyle} 
                onClick={() => onItemDelete([name])} />,
        ]}
	/>;
}


class DataTab extends React.Component {
    constructor() {
        super();
        this.state = {
            selected_project: '',
            sampleList: []
        }
        this.q_sample = null;
    }

    componentDidMount() {
        // init with pre-selected project
        this.handleProjectSelect(this.props.selected_project);
        //this.setState({selected_project: this.props.selected_project});
    }

    componentWillUnmount() {
        // store currently selected project information in the store
        if (this.props.onClose){
            this.props.onClose('selected_project', this.state.selected_project);
        }
    }

    handleProjectSelect = (project_name) => {
        const idx = this.props.projects.findIndex(p => p.name === project_name);
        if (idx === -1) {
            console.log('Unknown project name: ', project_name);
            return;
        }

        const project = this.props.projects[idx];
        axios.post("/api/data/samplelist", project)
            .then(resp => {
                this.setState({
                    selected_project: project.name,
                    sampleList: resp.data
                });
            })
            .catch(e => {
                console.log('[ERROR] getSampleList: ', e);
            });
    }

    addSamples = (keyArray) => {
        const { sampleList, selected_project } = this.state;
        const { sampleSelected, projects } = this.props;

        const samplesToAdd = keyArray.map(key => {
            // _id: sample name
            const {_id, count} = sampleList[key];
            if (sampleSelected.indexOf(_id) === -1) 
                return _id;
        }).filter(d => d != null);

        const idx = projects.findIndex(p => p.name === selected_project);
        if (idx === -1) {
            console.log('Unknown project name: ', selected_project);
            return;
        }

        if (samplesToAdd.length && this.props.onSampleAdd) {
            this.props.onSampleAdd(samplesToAdd, projects[idx]);
        }
    }

    handleAddAll = () => {
        const { sampleList, selected_project } = this.state;
        const { sampleSelected, projects } = this.props;
        const samplesToAdd = sampleList.map( sample => {
            const {_id, count} = sample;
            if (sampleSelected.indexOf(_id) == -1)
                return _id;
        }).filter(d => d != null);

        const idx = projects.findIndex(p => p.name === selected_project);
        if (idx === -1) {
            console.log('Unknown project name: ', selected_project);
            return;
        }

        if (this.props.onSampleAdd) {
            this.props.onSampleAdd(samplesToAdd, projects[idx]);
        }
    }

    handleDelAll = () => {
        const { sampleSelected } = this.props;
        if (sampleSelected.length && this.props.onSampleDel) {
            this.props.onSampleDel(sampleSelected);
        }
    }

    handleSampleChange = (_, event) => {
        const targetID = event.target.id;
        const enterKey = event.which != null && event.which === 13;
        const validQuery = this.q_sample != null && this.q_sample.length;
        
        if (targetID != null && targetID.length) {
            this.addSamples([targetID]);
        } else if (enterKey && validQuery) {
            const query = this.q_sample.trim().replace(/ /g, "_").toUpperCase();
            const indices = this.state.sampleList.map( (sample, idx) => {
                const {_id, count} = sample;
                if (_id.trim().toUpperCase().includes(query))
                    return idx
            }).filter(d => d != null);
            this.addSamples(indices);
        } else {
            console.log("[handleSampleChange] Unexpected cases!")
        }

        this.q_sample = null;
    }

    renderSelectedSamples = () => {
        const { 
            sampleSelected, 
            sampleSelectedCounts,
            sampleColors, 
            onColorChange, 
            onSampleDel 
        } = this.props;
        const opacity = 0.5;
        
        const list = sampleSelected.map((name, idx) => {
            return {
                key: name,
                value: name,
                count: sampleSelectedCounts[idx]
            };
        }).sort( (a, b) => sortAlphaNum(a.value, b.value) );

        return list.map(d => {
            const {key, value, count} = d;
            return <DataListItem 
                key={`item-${value}`} 
                id={key}
                name={value}
                color={ hexToRGBA(sampleColors[value], opacity)}
                count={count}
                onColorChange={onColorChange}
                onItemDelete={onSampleDel}
            />
        });
    }

    projectItem = (project) => {
        const containerStyle = {
            display: 'flex',
            flexDirection: 'row'
        };
        const contentStyle = {
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 2
        };

        const statistics = `xml: ${project.xml}, jpg: ${project.jpg}, tiff: ${project.tiff}`;
        return (
            <div style={containerStyle}>
                <div style={contentStyle}>
                    <span><strong>{project.name}</strong><small>{` :${project.path}`}</small></span>
                    <small>{`${project.author}, ${statistics}, ${project.last_updated}`}</small>
                </div>
            </div>
        );
    }

    renderSampleView = () => {
        const divStyle = {
            display: 'inline-block',
            width: '65%',
            marginRight: '10px'    
        }
        const { sampleList } = this.state;
        const { height, sampleSelected } = this.props;
        const ListHeight = height - 300;

        const samples = {};
        const local_selected = sampleList.map( (sample, idx) => {
            // _id: sample group name
            // count: the number of items in the sample group
            const {_id, count} = sample;
            samples[idx] = `[${count}] ${_id}`;
            if (sampleSelected.indexOf(_id) >= 0)
                return idx;
        }).filter(d => d != null);

        const projects = this.props.projects.map(p => {
            if (p.valid === 'true')
                return {...p, value: p.name};
        }).filter(d => d!=null);

        return (
            <div className={theme.tabDiv}>
                <Dropdown
                    auto={true}
                    source={projects}
                    onChange={this.handleProjectSelect}
                    label='Select a project'
                    value={this.state.selected_project}
                    template={this.projectItem}
                />
                <div style={divStyle}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition="none"
                        label="Select samples"
                        suggestionMatch="anywhere"
                        source={samples}
                        value={local_selected}
                        onQueryChange={q => this.q_sample = q}
                        onChange={this.handleSampleChange}
                        theme={theme}
                    />
                </div>
                <div style={{...divStyle, width: '15%', marginRight: '5px'}}>
                    <Button 
                        icon="select_all" 
                        label="ADD ALL" 
                        flat 
                        primary 
                        onClick={this.handleAddAll} 
                    />
                </div>
                <div style={{...divStyle, width: '15%', marginRight: '0px'}}>
                    <Button 
                        icon="clear" 
                        label="DEL ALL" 
                        flat 
                        primary 
                        onClick={this.handleDelAll} 
                    /> 
                </div>
                <List selectable>
                    <ListSubHeader caption={"Selected Samples"} />
                    <div style={{
                        height: `${ListHeight}px`,
                        overflowY: "scroll"
                    }}>
                        {this.renderSelectedSamples()}
                    </div>
                </List>
            </div>
        );
    }

    renderDBView = () => {
        return (
            <div className={theme.tabDiv}>
                <DBView
                    inputLabel="Selected directory"
                    dialogTitle="Select a working directory"
                    disabled={false}
                />
            </div>
        );
    }

    render() {
        return (
            <div>
                {/* {this.renderDBView()} */}
                {this.renderSampleView()}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleSelected: getSelectedSamples(state),
        sampleSelectedCounts: getSelectedSamplesCounts(state),
        sampleColors: state.data.sampleColors,
        projects: state.data.projects,
        selected_project: state.data.selected_project,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onSampleAdd: get_data,
        onSampleDel: del_data,
        onColorChange: changeSelectedSampleColors,
        onClose: setValue
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTab);