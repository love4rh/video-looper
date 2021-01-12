import { removeTags } from '../common/tool.js';


const srtTool = {
	isNewItem: (s, idx) => {
		return '' + idx === s;
	},

	// whether s is similar to 00:01:09,736 --> 00:01:11,773
	isTimeLine: (s) => {
		return s.length === 29
			&& s[2] === ':' && s[5] === ':' && s[8] === ','
			&& s[13] === '-' && s[14] === '-' && s[15] === '>'
			&& s[19] === ':' && s[22] === ':' && s[25] === ',';
	},

	parseTime: (s, start) => {
		const tm = (s.charCodeAt(start + 0) - 48) * 10 + (s.charCodeAt(start + 1) - 48) * 3600
			+ (s.charCodeAt(start + 3) - 48) * 10 + (s.charCodeAt(start + 4) - 48) * 60
			+ (s.charCodeAt(start + 6) - 48) * 10 + (s.charCodeAt(start + 7) - 48)

		return tm + ((s.charCodeAt(start + 9) - 48) * 100 + (s.charCodeAt(start + 10) - 48) * 10 + (s.charCodeAt(start + 11) - 48)) / 1000;
	},

	convert: (lines) => {
		let idx = 1;
		const ar = [];
		let item = null;

		for(let i = 0; i < lines.length; ++i) {
			const s = lines[i].trim();

			if( srtTool.isNewItem(s, idx) ) {
				item = { idx, text: '' };
				idx += 1;
			} else if( srtTool.isTimeLine(s) ) {
				item.start = srtTool.parseTime(s, 0);
				item.end = srtTool.parseTime(s, 17);
			} else if( s === '' && item !== null ) {
				item.text = removeTags(item.text);
				ar.push(item);
				item = null;
			} else if( item !== null ) {
				if( s === '' ) {
					item.text = removeTags(item.text);
					ar.push(item);
					item = null;
				} else {
					item.text += (item.text.length > 0 ? ' ' : '') + s;
				}
			}
		}

		if( item !== null ) {
			item.text = removeTags(item.text);
			ar.push(item);
		}

		// console.log(ar);

		return ar;
	}
};

export default srtTool;
export { srtTool };
