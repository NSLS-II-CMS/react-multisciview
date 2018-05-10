import os
import numpy as np
import xml.etree.ElementTree as ET
from PIL import Image

class xmlParser(object):
    def __init__(self, config):
        self.config = config

    def _get_value(self, x):
        if isinstance(x, list):
            return x[-1]
        return x

    def _get_value_by_key(self, doc, key, default_value):
        if key in doc:
            val = doc[key]

            if not isinstance(default_value, str):
                val = float(val)
            else:
                val = self._get_value(val.split('/'))

            return val
        return default_value

    def _add_protocol(self, pr_name, pr_time, val, doc):
        if pr_name in doc:
            if pr_time > doc[pr_name]['time']:
                val['time'] = pr_time
                doc[pr_name] = {'data': val, 'time': pr_time}
        else:
            doc[pr_name] = {'data': val, 'time': pr_time}
        return doc

    def xml_to_doc(self, filename):
        tree = ET.parse(filename)
        doc = dict()

        root = tree.getroot()
        root_att = root.attrib

        item_name = self._get_value_by_key(root_att, self.config['ROOTID'], 'unknown')
        if item_name == 'unknown':
            return None
        item_name = os.path.splitext(item_name)[0]

        sample_name = item_name.split(self.config['SAMPLE_SPLIT'])[0]
        doc['item'] = item_name
        doc['sample'] = sample_name

        # Loop over all protocols
        for protocol in root:
            pr_att = protocol.attrib
            pr_name = self._get_value_by_key(pr_att, self.config['PID'], 'unknown')
            pr_time = self._get_value_by_key(pr_att, self.config['TIMESTAMP'], 0)
            if pr_name == 'unknown':
                continue

            # special case for thumbnails protocol
            if pr_name == 'thumbnails':
                #self._add_protocol(pr_name, pr_time, item_name, doc)
                continue

            pr_dict = dict()
            for experiment in protocol:
                ex_att = experiment.attrib
                ex_name = self._get_value_by_key(ex_att, self.config['RID'], 'unknown')
                if ex_name == 'unknown' or ex_name in self.config['R_EXCLUDE']:
                    continue

                default_value = '0' if ex_name in self.config['R_STRING'] else 0
                ex_value = self._get_value_by_key(ex_att, self.config['RVAL'], default_value)
                pr_dict[ex_name] = ex_value
            self._add_protocol(pr_name, pr_time, pr_dict, doc)

        #doc['tiff'] = item_name
        return doc

    def tiff_to_doc(self, filename):
        im = Image.open(filename)
        imarr = np.array(im)
        dim = imarr.shape

        tiff_doc = dict()
        tiff_doc['data'] = imarr
        tiff_doc['width'] = int(dim[1])
        tiff_doc['height'] = int(dim[0])
        tiff_doc['channel'] = int(1)
        tiff_doc['min'] = float(imarr.min())
        tiff_doc['max'] = float(imarr.max())

        item = os.path.splitext(filename)[0]
        item = item.split('/')[-1]
        doc = dict()
        doc['item'] = item
        doc['tiff'] = tiff_doc

        return doc

    def jpg_to_doc(self, filename):
        im = Image.open(filename)
        imarr = np.array(im)
        dim = imarr.shape

        jpg_doc = dict()
        jpg_doc['data'] = imarr
        jpg_doc['width'] = int(dim[1])
        jpg_doc['height'] = int(dim[0])
        jpg_doc['channel'] = int(dim[2])

        item = os.path.splitext(filename)[0]
        item = item.split('/')[-1]
        doc = dict()
        doc['item'] = item
        doc['jpg'] = jpg_doc

        return doc
