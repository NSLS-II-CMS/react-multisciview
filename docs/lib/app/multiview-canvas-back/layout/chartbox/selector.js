import { createSelector } from 'reselect';
import forEach from 'lodash.foreach';
import uniqBy from 'lodash.uniqby';
import get from 'lodash.get';
import { scaleLinear, scalePoint } from 'd3-scale';
import { extent as d3Extent } from 'd3-array';

import { sortAlphaNum } from '../../utils';

import { format as d3Format } from 'd3-format';

const getDataBySamples = state => state.data.dataBySamples;
const getSampleKinds = state => state.data.sampleKinds;
const getAttrTypes = state => state.data.attrTypes;

const getSelectedSampleKeys = state => state.data.samples;
const getSelectedSampleColors = state => state.data.sampleColors;

export const getSelectedDataItemList = state => state.data.selectedItemList;

export const getAttrX = state => state.vis.attrx;
export const getAttrY = state => state.vis.attry;
export const getAttrZ = state => state.vis.attrz;

export const getImgPool = state => state.data.imgPool;

export const getColorsBySampleNames = createSelector(
    [
        getSampleKinds,
        getSelectedSampleColors,
    ],
    (
        kinds,
        colors
    ) => {
        const colorsBySampleNames = {};
        forEach(colors, (color, key) => {
            colorsBySampleNames[kinds[key]] = color;
        });
        return colorsBySampleNames;
    }
);

export const getSelectedSampleNames = createSelector(
    [
        getSampleKinds,
        getSelectedSampleKeys
    ],
    (
        kinds,
        keys
    ) => {
        return keys.map(key => kinds[key]);
    }
);

export const getSelectedDataArray = createSelector(
    [
        getSelectedSampleNames,
        getDataBySamples,
        getAttrTypes,
    ],
    (
        selectedSampleNames,
        data,
        types,
    ) => {
        let selectedDataArray = [];
        const g_minmax = {};

        forEach(data, (dataObject, sampleName) => {
           if (selectedSampleNames.includes(sampleName)) {
                const { data, indexById, minmax } = dataObject;

                selectedDataArray = selectedDataArray.concat(data);

                //console.log(sampleName, minmax);
                forEach(minmax, (value, attr) => {
                    if (g_minmax[attr] == null) {
                        g_minmax[attr] = value;
                    } else {
                        const t = types[attr];
                        let g_value = g_minmax[attr];
                        if (t === 'num') {
                            g_value[0] = Math.min(g_value[0], value[0]);
                            g_value[1] = Math.max(g_value[1], value[1]);
                        } else if (t === 'str') {
                            g_value = uniqBy(g_value.concat(value), d => d);
                            g_minmax[attr] = g_value;
                        } else {
                            // ignore unknown type
                        }
                    }
                });
           }
        });
        return {
            data: selectedDataArray,
            extents: g_minmax
        }
    }
);
