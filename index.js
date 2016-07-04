// a streaming ansi parser (maybe)

const C = require('./constants');

function ctrlSequenceReducer(code, seq) {

  var matches = new RegExp(code, 'g').exec(seq);
  if(matches[1] === undefined) matches[1] = '';
  var args = matches[1].split(';');

  var key = seq[seq.length - 1];
  var codes = args.map(function(arg) {
    var seqType = ctrlSequence(key, arg);
    if(seqType.type === 'none') {
      seqType = Object.assign({}, seqType, { content: seq });
    }
    return seqType;
  });

  return codes;
}

function ctrlSequence(key, num) {
  switch(key) {
    case 'm':
      // DISPLAY
      num = Number(num);
      //console.log(key, num);
      switch(num) {
        case 0: return C.RESET_CHAR_ATTRS;
        case 1: return C.CHAR_ATTRS_BRIGHT;
        case 2: return C.CHAR_ATTRS_DIM;
        case 4: return C.CHAR_ATTRS_UNDERLINE;
        case 5: return C.CHAR_ATTRS_BLINK;
        case 7: return C.CHAR_ATTRS_REVERSE;
        case 8: return C.CHAR_ATTRS_HIDDEN;
        case 30: return C.CHAR_ATTRS_FOREGROUND_BLACK;
        case 31: return C.CHAR_ATTRS_FOREGROUND_RED;
        case 32: return C.CHAR_ATTRS_FOREGROUND_GREEN;
        case 33: return C.CHAR_ATTRS_FOREGROUND_YELLOW;
        case 34: return C.CHAR_ATTRS_FOREGROUND_BLUE;
        case 35: return C.CHAR_ATTRS_FOREGROUND_MAGENTA;
        case 36: return C.CHAR_ATTRS_FOREGROUND_CYAN;
        case 37: return C.CHAR_ATTRS_FOREGROUND_WHITE;
        case 40: return C.CHAR_ATTRS_BACKGROUND_BLACK;
        case 41: return C.CHAR_ATTRS_BACKGROUND_RED;
        case 42: return C.CHAR_ATTRS_BACKGROUND_GREEN;
        case 43: return C.CHAR_ATTRS_BACKGROUND_YELLOW;
        case 44: return C.CHAR_ATTRS_BACKGROUND_BLUE;
        case 45: return C.CHAR_ATTRS_BACKGROUND_MAGENTA;
        case 46: return C.CHAR_ATTRS_BACKGROUND_CYAN;
        case 47: return C.CHAR_ATTRS_BACKGROUND_WHITE;
        default: return C.CHAR_ATTRS_NONE;
      }
    case 'A':
      num = Number(num);
      return { type: 'arrowUp', count: num };
    case 'B':
      num = Number(num);
      return { type: 'arrowDown', count: num };
    case 'C':
      num = Number(num);
      return { type: 'arrowRight', count: num };
    case 'D':
      num = Number(num);
      return { type: 'arrowLeft', count: num };
    case 'J':
      num = Number(num);
      switch(num) {
        case 0: return C.CTRL_ERASE_DOWN;
        case 1: return C.CTRL_ERASE_UP;
        case 2: return C.CTRL_ERASE_ALL;
        default: return C.CHAR_ATTRS_NONE;
      }
    case 'K':
      num = Number(num);
      switch(num) {
        case 0: return C.CTRL_ERASE_LINE_RIGHT;
        case 1: return C.CTRL_ERASE_LINE_LEFT;
        case 2: return C.CTRL_ERASE_LINE_ALL;
        default: return C.CHAR_ATTRS_NONE;
      }
    case 'H':
      if(num) {
        var [row, col] = num.split(';');
      } else {
        var [row, col] = [1, 1];
      }
      return { type: 'moveCursor', row, col };
    default: return C.CHAR_ATTRS_NONE;
  }
}

const known_codes = [
  /\u001b\[(\d*(;\d+)*)m/,
  /\u001b\[(\d+?;\d+?)?H/,
  /\u001b\[([012]?)J/,
  /\u001b\[([012]?)K/,
  /\u001b\[(\d*)A/,
  /\u001b\[(\d*)B/,
  /\u001b\[(\d*)C/,
  /\u001b\[(\d*)D/,
  /\u001b\[\?1h/,
  /\u001b\[\?1l/,
  ///\u001b=/, // DECKPAM alternate keypad
  ///\u001b>/, // DECKPNM numeric keypad
];

function isCtrlChar(c) {
  return /[A-Za-z=>]/.test(c);
}

function Parser() {
  this.buffer = '';
}

Parser.prototype.writeChar = function(c) {
  c = String.fromCharCode(c);
  this.buffer += c;

  if(isCtrlChar(c)) {
    return this.parse();
  }

};

Parser.prototype.parse = function() {
  var ctrlSeq = known_codes.reduce((seq, code) => {
    if(!code.test(this.buffer)) return seq;

    var codes = ctrlSequenceReducer(code, this.buffer);
    return codes.length === 0 ? seq : codes;
  }, [{ type: 'none', content: this.buffer }]);
  this.reset();
  return ctrlSeq;
};

Parser.prototype.reset = function() {
  this.buffer = '';
};

module.exports = Parser;
