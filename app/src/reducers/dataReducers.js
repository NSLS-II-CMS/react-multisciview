import { getRandomColor, rgbToHex } from "../utils";
import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { get_tiff } from "./getImage";

const INIT_STATE = {
    /**
     * dataBySamples
     * - {[sampleName]: data object}
     * 
     * data object
     * - [data]: data array
     * - [minmax]: min, max values for numeric field
     * - [count]: data array size
     */
    dataBySamples: {},

    /**
     * statBySamples
     * - {[sampleName]: count}
     */
    //statBySamples: {},

    /**
     * sampleSelected
     * - array of sampleName selected for visualization
     */
    //sampleSelected: [],

    /**
     * sampleColors
     * - colors of each sample
     * - [sampleName]: color
     */
    sampleColors: {},

    // coordinate options
    attrx: "metadata_extract/data/sequence_ID",
    attry: "metadata_extract/data/annealing_temperature",
    attrz: "sample",
    scatterColorSchemes: {},
    scatterColorOpacity: 0.5,

    // image options
    showImage: false,
    minPoints: 40,
    minImageSize: 15,

    imgPool: {},
    imgColorMap: null,
    imgMinDomain: 0,
    imgMaxDomain: 1,
    imgDomain: null, //[0, 1],
    imgColorScheme: 'Custom',
    getOrigImgValue: null,

    numImageRequested: 0,

    // pcp options
    pcpSelectedAttrs: [
		"sample",
		"metadata_extract/data/annealing_temperature",
		"metadata_extract/data/annealing_time",
		"linecut_qr/data/fit_peaks_d0",
		"linecut_qr/data/fit_peaks_sigma1",
    ],

    // MongoDB
    dbName: null,
    colName: null,

    // file watcher
    wID: null,
    isConnected: false,
    wdir: '/root',
    wNodeKey: 'N0',
    wNodeList: [['N0', {name: '/root', path: '/root', children: []}]],
    wNodeMap: new Map([['N0', {name: '/root', path: '/root', children: []}]]),

    // file syncer
    sID: null,
    total: 0,
    processed: 0,

    // temporal message
    message: '',
    messageReady: false,
    messageType: 'warning', // accept: green, warning: yellow, cancel: red
}

const _update_sample_colors = (state, sampleList) => {
    const sampleColors = {...state.sampleColors};
    const usedColors = Object.keys(sampleColors).map(key => sampleColors[key]);

	sampleList.forEach(name => {
        if (sampleColors[name] == null) {
            const color = getRandomColor(usedColors);
            usedColors.push(color);
            sampleColors[name] = color; // eslint-disable-line    
        }
	});

    return sampleColors;
}

// deprecated
const get_current_data_stat = (state, payload) => {
    const sampleNames = Object.keys(payload);
    const sampleColors = _update_sample_colors(state, sampleNames);

	return {
		...state,
		statBySamples: payload,
		sampleColors
	};    
}

const get_data = (state, payload) => {
    const {data, db, col} = payload;
    const {sampleList, sampleData} = data;

    const dataBySamples = {...state.dataBySamples};
    const keyList = sampleList.map(name => {
        const key = `[${db}][${col}]${name}`;
        dataBySamples[key] = [...sampleData[name]];
        return key;
    });

    const sampleColors = _update_sample_colors(state, keyList);
    // console.log('reducer: ', dataBySamples);
    // console.log('reducer: ', sampleColors)
    return {...state,
        dataBySamples: dataBySamples,
        sampleColors: sampleColors
    };
}

const del_data = (state, payload) => {
    const dataBySamples = {...state.dataBySamples};
    payload.forEach(key => {
        delete dataBySamples[key];
    });
    return {...state, dataBySamples: dataBySamples};
}

const get_color_map = (state, payload) => {
	const colors = payload.slice();
    colors.reverse();

	const domain = colors.map((d, i) => i);
	const range = colors.map(d => {
		return rgbToHex(d.r, d.g, d.b);
	});
	const colorScale = scaleLinear()
		.domain(domain)
		.range(range)
		.interpolate(interpolateRgb);

	return {
		...state,
		imgColorMap: colorScale.copy()
	};    
}

const change_selected_sample_colors = (state, payload) => {
	const sampleColors = { ...state.sampleColors };
	const usedColors = Object.keys(sampleColors).map(key => sampleColors[key]);

	payload.forEach(name => {
		const color = getRandomColor(usedColors);
		usedColors.push(color);
		sampleColors[name] = color; 
	});

	return { ...state, sampleColors };    
}

const change_data_attr = (state, payload) => {
    const {dim, attr} = payload;
    let oldattr, fieldname;
    switch (dim) {
        case "x": oldattr = state.attrx; fieldname='attrx'; break;
        case "y": oldattr = state.attry; fieldname='attry'; break;
        case "z": oldattr = state.attrz; fieldname='attrz'; break;
        default: return state;
    }
    if (oldattr != attr) 
        return {...state, [fieldname]:attr };
    return state;
}

const change_scatter_color_domain = (state, payload) => {
    const domain = payload, attr = state.attrz;
    const prev = state.scatterColorSchemes[attr] ? state.scatterColorSchemes[attr]: {};
    return {...state, 
        scatterColorSchemes: {
            ...state.scatterColorSchemes,
            [attr]: {...prev, colorDomain: domain}
        }
    };
}

const change_scatter_color_scheme = (state, payload) => {
    const scheme = payload, attr = state.attrz;
    const prev = state.scatterColorSchemes[attr] ? state.scatterColorSchemes[attr]: {};
    return {...state,
        scatterColorSchemes: {
            ...state.scatterColorSchemes,
            [attr]: {...prev, type: scheme}
        }
    };
}

const set_value = (state, payload) => {
    const {name, value} = payload;
    if (state[name] != null) {
        return {...state, [name]: value};
    }
    return state;
}

const get_root_dir_list = (state, payload) => {
    const {dirList, nodeid} = payload;

    return {
        ...state,
        wNodeKey: nodeid,
        wNodeList: dirList,
        wNodeMap: new Map(dirList)
    };
}

const set_watcher_nodekey = (state, payload) => {
    const nodekey = payload;
    const {wNodeMap} = state;
    const node = wNodeMap.get(nodekey);
    return {
        ...state,
        wdir: node.path,
        wNodeKey: nodekey
    }
}

const set_watcher_connection = (state, payload) => {
    const { status } = payload;
    return {...state, isConnected: status};
}

const get_watcher_monitor = (state, payload) => {
    const {sampleList, sampleData, stat} = payload;
    //console.log(sampleList, stat)

    if (sampleList.length == 0) 
        return state;

    const dataBySamples = {...state.dataBySamples};

    // [WARN]: violate mutate??????????
    let message = 'New sample added: ';
    let messageReady = false;
    //console.log(sampleList, stat)
    sampleList.forEach((name, index) => {
        if (dataBySamples[name] == null) {
            messageReady = true;
            message = message + `[${name}] `;
            //console.log('[!] Sample selected, but no data???');
        } else {
            sampleData[name].forEach(doc => {
                const foundIndex = dataBySamples[name].findIndex(o => o._id == doc._id || o.item == doc.item); 
                if (foundIndex >= 0) {
                    dataBySamples[name][foundIndex] = doc;
                } else {
                    dataBySamples[name].push(doc)
                }                   
            });
        }
    });

    const sampleColors = _update_sample_colors(state, sampleList);

    return {...state,
        dataBySamples: dataBySamples,
        sampleColors: sampleColors,
        statBySamples: stat,
        message: message,
        messageReady: messageReady,
        messageType: 'warning', // accept: green, warning: yellow, cancel: red
    };
}

const set_sync_info = (state, payload) => {
    const {id, processed, total} = payload;
    return {...state, sID: id, total: total, processed: processed}
}

const update_db_info = (state, payload) => {
    const {db, col} = payload;
    return {...state, dbName:db, colName:col};
}

export function dataReducers(state = INIT_STATE, action) {
    const {type, payload} = action;

    let _type = type;
    if (_type.includes('REJECTED'))
        _type = "REJECTED"

    switch (_type) {
        case "GET_CURRENT_DATA_STAT": return get_current_data_stat(state, payload);
        case "GET_DATA": return get_data(state, payload);
        case "DEL_DATA": return del_data(state, payload);

        case "GET_TIFF": return get_tiff(state, payload);
        case "GET_COLORMAP": return get_color_map(state, payload);
        
        case "CHANGE_SELECTED_SAMPLE_COLORS": return change_selected_sample_colors(state, payload);
        case "CHANGE_DATA_ATTR": return change_data_attr(state, payload);
        case "CHANGE_SCATTER_COLOR_DOMAIN": return change_scatter_color_domain(state, payload);
        case "CHANGE_SCATTER_COLOR_SCHEME": return change_scatter_color_scheme(state, payload);

        case "SET_VALUE": return set_value(state, payload);
        case "CHANGE_IMAGE_COLOR_SCHEME": return {...state, imgColorScheme: payload};
        case "CHANGE_IMAGE_DOMAIN": return {...state, imgDomain: payload};
        case "CHANGE_PCP_SELECTED_ATTRS": return {...state, pcpSelectedAttrs: payload.slice()};

        case "GET_ROOT_DIR_LIST": return get_root_dir_list(state, payload);
        case "SET_WATCHER_NODEKEY": return set_watcher_nodekey(state, payload);
        case "GET_WATCHER_CONNECT": return set_watcher_connection(state, payload);
        case "GET_WATCHER_DISCONNECT": return set_watcher_connection(state, payload);
        case "GET_WATCHER_MONITOR": return get_watcher_monitor(state, payload);

        case "SET_SYNC_INFO": return set_sync_info(state, payload);
        case "CLOSE_MESSAGE": return {...state, messageReady: false};

        case "UPDATE_DB_INFO": return update_db_info(state, payload);

        case "REJECTED":
            console.log(payload);
            return state;
        default: return state;
    }
}