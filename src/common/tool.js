const isundef = function(o) {
	return o === null || typeof o === 'undefined';
}

exports.isundef = isundef;


exports.isvalid  = function(o) {
	return !isundef(o);
}


exports.makeMap = function(list, keyName) {
	let map = {};

	for (let i = 0; i < list.length; ++i) {
		const item = list[i];
		map[item[keyName]] = item;
	}

	return map;
}


exports.nvl = function(str, val) {
	return !isundef(str) ? str : val;
}


exports.nvl2 = function(str, val) {
	return (isundef(str) || '' === str) ? val : str;
}


exports.tickCount = function() {
	return new Date().getTime();
}


exports.istrue = function(v) {
	return !isundef(v) && v;
}


exports.hasKey = function(obj, key) {
	return obj ? hasOwnProperty.call(obj, key) : false;
}


exports.uuid4 = function() {
	// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	let uuid = '', ii;

	for (ii = 0; ii < 32; ii += 1) {
		switch (ii) {
			case 8:
			case 20:
				uuid += '-';
				uuid += (Math.random() * 16 | 0).toString(16);
				break;
			case 12:
				uuid += '-';
				uuid += '4';
				break;
			case 16:
				uuid += '-';
				uuid += (Math.random() * 4 | 8).toString(16);
				break;
			default:
				uuid += (Math.random() * 16 | 0).toString(16);
		}
	}

	return uuid;
}


const isIn = function(val, valList) {
	if (isundef(val) || isundef(valList)) return false;

	for (let i = 0; i < valList.length; ++i) {
		if (valList[i] === '' + val) return true;
	}

	return false;
}


exports.isIn = isIn;

exports.isInArray = function(valList1, valList2) {
	if (isundef(valList1) || isundef(valList2)) return false;

	for (let i = 0; i < valList1.length; ++i) {
		if (isIn(valList1[i], valList2)) {
			return true;
		}
	}

	return false;
}


const getIndexInList = function(val, valList) {
	if (isundef(val)) return -1;
	val = '' + val;

	for (let i = 0; i < valList.length; ++i) {
		if ('' + valList[i] === val) return i;
	}

	return -1;
}

exports.getIndexInList = getIndexInList;

exports.nextValueInList = function(val, valList) {
	if (valList.length < 1) {
		return null;
	} else if (valList.length === 1) {
		return valList[0];
	}

	const nextIdx = getIndexInList(val, valList) + 1;
	if (nextIdx < valList.length ) {
		return valList[nextIdx];
	}

	return valList[0];
}


exports.getIndexInListEx = function(val, valList, key) {
	if (isundef(val)) return -1;
	val = '' + val;

	for (let i = 0; i < valList.length; ++i) {
		if ('' + valList[i][key] === val) return i;
	}

	return -1;
}


exports.makeid = function(digitNum) {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (let i = 0; i < digitNum; ++i) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}


exports.isInteger = function (value) {
  return (typeof value === 'number'
    && isFinite(value)
    && Math.round(value) === value
  );
}


exports.jsonParse = function(str) {
	if( typeof str !== 'string' ) {
		return typeof str === 'object' ? str : null;
	}

	var jsonObj = null;

	try {
		jsonObj = JSON.parse(str)
	} catch(e) {
		jsonObj = null;
	}

	return jsonObj;
}


// 객체를 똑같이 복사하여 생성한 객체 반환. (Deep Copy)
exports.copyObject = function(obj) {
	return JSON.parse(JSON.stringify(obj));
}


exports.readTextFile = function(file, cb) {
	const reader = new FileReader();

  reader.onload = () => {
		if( cb ) { cb(reader.result); }
	};

	reader.onerror = () => {
		if( cb) { cb(null); }
	}

  reader.readAsText(file);
}


exports.removeTags = (html) => {
	let div = document.createElement('div');
	div.innerHTML = html;
	return div.textContent || div.innerText || '';
}


const pad = (n) => {
	return n < 10 ? '0' + n : '' + n;
}

exports.pad = pad;

const pad2 = (n) => {
	return n < 10 ? '00' + n : (n < 100 ? '0' + n : '' + n);
}

// 65.123 --> 00:01:05.123
exports.secToTime = (sec) => {
	const h = Math.floor(sec / 3600);
	sec -= h * 3600;
	const m = Math.floor(sec / 60);
	sec -= m * 60;
	const s = Math.floor(sec);
	sec -= s; // sec maybe 0.123

	return pad(h) + ':' + pad(m) + ':' + pad(s) + '.' + pad2(Math.floor(sec * 1000));
}

var _logger_ = null;

exports.setLogger = function(logger) {
	_logger_ = logger;
}


/**
	level --------------
	emergency: 0,
	alert: 1,
	critical: 2,
	error: 3,
	warning: 4,
	notice: 5,
	info: 6,
	...
 */
exports.debugOut = function(m, w, o) {
	// TODO 아래 라인 제거
	// if( m === 'LSS') return;

	var msg = o;
	var level = 6;

	if (typeof o === 'object') {
		msg = isundef(o) ? 'undefined' : JSON.stringify(o);
	}

	console.log(new Date(), m, w, msg);

	if (!isundef(_logger_)) {
		var p = 0;
		var limit = 768;
		var wh = '<' + w + '> ';

		/*
		const pmloglib = {
		  emergency: 0,
		  alert: 1,
		  critical: 2,
		  error: 3,
		  warning: 4,
		  notice: 5,
		  info: 6,
		  ...
		} // */
		while (p < msg.length) {
			var r = Math.min(msg.length - p, limit);
			_logger_.log(level, m.toUpperCase(), {}, wh + msg.substring(p, p + r));
			p += r;
		}
	}
}

let _globalMsgHandler_ = null;
exports.setGlobalMessageHandle = function(handle) {
	_globalMsgHandler_ = handle;
}

exports.showGlobalMessage = function(msg) {
	if( _globalMsgHandler_ ) {
		_globalMsgHandler_(msg);
	}
}


/*
exports.printOut = function(m, w, o) {
	loggingOut(6, m, w, o);
}


exports.debugOut = function(m, w, o) {
	loggingOut(7, m, w, o);
}
// */