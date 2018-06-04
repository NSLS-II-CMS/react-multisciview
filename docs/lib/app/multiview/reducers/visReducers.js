import { setAttr } from "./visHelper";

const INITIAL_STATE = {
	samples: [], // unused
	sampleColors: {}, // unused

	attrx: "metadata_extract/data/sequence_ID",
	attry: "metadata_extract/data/annealing_temperature",
	attrz: "sample",

	showImage: false,
	minPoints: 20,
	minImageSize: 10,

	// for pcp
	selectedDimension: [
		"sample",
		"metadata_extract/data/annealing_temperature",
		"metadata_extract/data/annealing_time",
		"linecut_qr/data/fit_peaks_d0",
		"linecut_qr/data/fit_peaks_sigma1"
	],

	// for z-axis colorSchemes
	colorSchemes: {}

};

function setSwitch(state, payload) {
	const { name, value } = payload;
	switch (name) {
	case "showImage": return { ...state, showImage: value };
	default: return state;
	}
}

function setSlider(state, payload) {
	const { name, value } = payload;
	switch (name) {
	case "minPoints": return { ...state, minPoints: value };
	case "minImageSize": return { ...state, minImageSize: value };
	default: return state;
	}
}

function setSelectDim(state, payload) {
	return { ...state, selectedDimension: payload.slice() };
}

function setZColorScheme(state, payload) {
	const {attr, newScheme} = payload;
	const prev = state.colorSchemes[attr] ? state.colorSchemes[attr]: {};
	return {...state,
		colorSchemes: {
			...state.colorSchemes,
			[attr]: {
				...prev,
				type: newScheme
			}
		}
	};
}

function setZColorDomain(state, payload) {
	const {attr, newDomain} = payload;
	const prev = state.colorSchemes[attr] ? state.colorSchemes[attr]: {};
	return {...state,
		colorSchemes: {
			...state.colorSchemes,
			[attr]: {
				...prev,
				colorDomain: newDomain
			}
		}
	};	
}

export function visReducers(state = INITIAL_STATE, action) {
	const { type, payload } = action;
	switch (type) {
	case "SET_ATTR": return setAttr(state, payload);
	case "SET_SWITCH": return setSwitch(state, payload);
	case "SET_SLIDER": return setSlider(state, payload);
	case "SET_PCP_SELECT_DIM": return setSelectDim(state, payload);
	case "SET_Z_COLOR_SCHEME": return setZColorScheme(state, payload);
	case "SET_Z_COLOR_DOMAIN": return setZColorDomain(state, payload);
	default: return state;
	}
}