/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function doExpand() {
  console.log('do expand');
  document.getElementById('aDropDown').classList.toggle('show');
  console.log('expanded');
}


// polyfill for matches
if (!Element.prototype.matches) {
  Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
          var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1;
        };
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(e) {
  if (!e.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName('dropdown-content');
    for (var d = 0; d < dropdowns.length; d++) {
      var openDropdown = dropdowns[d];
      console.log('remove show');
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};

// code from source

function require() {
  return function() {
    return function() {};
  };
}
window.module = {};

// code from history
var debug = require('debug')('history');

function History(options) {
  this._default = options && options.default || '';
  this._data = [];
  this._shadowvalue = [];
  this._save = options && options.save;
  this._length = options && options.length || 20;
  this._pos = (typeof options.pos === 'number') ? options.pos : (this._data.length);
  this._pos = Math.max(0, Math.min(this._data.length, this._pos));
  var that = this;
  if (options && typeof options.load === 'function') {
    options.load(function (err, oData) {
      if (err) {
        throw err;
      }
      if (oData && oData.entries) {
        if (that._data.length === 0) {
          that._data = oData.entries || [];
          that._pos = oData.pos;
        } else {
          that._data = oData.entries.concat(that._data);
          that._pos = that._pos + oData.entries.length;
          that._shiftIfNeeded();
        }
      }
    });
  }
  debug('here pos ' + this._pos);
}

History.prototype.get = function () {
  if(this._pos > this._data.length) {
    console.log('this shoudl not happen');
  }
  if(this._shadowvalue[this._pos] === undefined) {
    return this._data[this._pos];
  }
  return this._shadowvalue[this._pos];
};

History.prototype.forward = function (currentvalue) {
  // we are already at the end
  if (this._pos >= this._data.length) {
    return undefined; // marker not to alter anything!
  }
  this._shadowvalue[this._pos] = currentvalue;
  this._pos = this._pos + 1;
  return this.get();
  this._state = 'history';
};

History.prototype._shiftIfNeeded = function () {
  if (this._data.length > this._length) {
    this._pos = Math.max(0, this._pos - 1);
    debug('shifting array' + JSON.stringify(this._data));
    this._data = this._data.slice(1);
    debug('shifting array' + JSON.stringify(this._data) + ' new pos:' + this._pos);
    this.save();
  }
};

History.prototype.push = function (oNext) {
  if (oNext === null || oNext === undefined) {
    throw Error('Object cannot be null or undefined');
  }
  this._state = 'pushed';
  this._shadowvalue = [];
  // we add the record unless it's identical to the last one
  if (this._data.length && oNext === this._data[this._data.length - 1]) {
    // do not push
    this._pos = this._data.length;
    return;
  } else {
    this._data.push(oNext);
    this._pos = this._data.length;
    this._shiftIfNeeded();
    this.save();
    return;
  }
};

History.prototype.save = function () {
  if (this._save) {
    this._save({
      pos: this._pos,
      entries: this._data.slice(0)
    }, function (err) {
      if (err) {
        debug('error' + err);
      }
    });
  }
};
/*
History.prototype.set = function (oCurrent) {
  if (oCurrent !== this.get()) {
    this._current = oCurrent
  }
}
*/
History.prototype.backward = function (currentvalue) {
  if (this._data.length === 0) {
    return undefined;
  }
  if(this._pos <= 0) {
    return undefined;
  }
  this._shadowvalue[this._pos] = currentvalue;
  this._pos = this._pos  - 1;
  return this.get();
};

module.exports = History;


/// end of history

// code from source;

window.MyHistory = module.exports;
module = undefined;
    // You can also require other files to run in this process
    //var hs = require('./gen/utils/history.js');
    //var as = require('./gen/utils/appdata.js');
    //var ad = new as.PersistenceHandle("fdevstart","history.json")
function saveHistory(oData) {
  window.localStorage.setItem('jdbcsql_web_client', JSON.stringify(oData));
}
function loadHistory(cb) {
  try {
    var u = window.localStorage.getItem('jdbcsql_web_client');
    u = u && JSON.parse(u);
  } catch (e) {
    u = undefined;
  }
  cb(undefined, u);
}

window.inputHistory = new  window.MyHistory({
  length : 80,
  save: saveHistory,
  load: loadHistory
});


// textagg
!function(e,t){'function'==typeof define&&define.amd?define([],t):'object'==typeof module&&module.exports?module.exports=t():e.Autogrow=t();}(this,function(){return function(e,t){var o=this;
  void 0===t&&(t=999),o.getOffset=function(e){for(var t=window.getComputedStyle(e,null),o=['paddingTop','paddingBottom'],n=0,i=0;i<o.length;i++)n+=parseInt(t[o[i]]);
    return n;},o.autogrowFn=function(){var t=0,i=!1;
      return e.scrollHeight-n>o.maxAllowedHeight?(e.style.overflowY='scroll',t=o.maxAllowedHeight):(e.style.overflowY='hidden',e.style.height='auto',t=e.scrollHeight-n,i=!0),e.style.height=t+'px',i;};
  var n=o.getOffset(e);
  o.rows=e.rows||1,o.lineHeight=e.scrollHeight/o.rows-n/o.rows,o.maxAllowedHeight=o.lineHeight*t-n,e.addEventListener('input',o.autogrowFn);};});


function encodeStrAsHTML(rawstr) {
  var encodedStr = rawstr.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
    return '&#'+i.charCodeAt(0)+';';
  });
  return encodedStr.replace(/\n/g,'<br/>');
}

//

// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
// "Enter"
// "ArrowUp"
// "ArrowDown"

var Autogrow = window.Autogrow;
//require('./lib/textareaag.js');
//Then initialize the magic:

var textarea = document.getElementById('growme');
var growingTextarea = new Autogrow(textarea);

// keyup
// change
// paste
function updateText(eText) {
  var u = textarea.value;
}


function makeLi(value, sType) {
  if(sType !== 'request' && sType !== 'response') {
    throw new Error('illegal type');
  }
  var li = document.createElement('li');
  var div = document.createElement('div');
  li.appendChild(div);
  li.classList.add('common');
  li.classList.add(sType);
  div.classList.add('common');
  div.classList.add(sType);
  div.innerText = value;
  div.innerHTML = encodeStrAsHTML(value);
  textarea.parentNode.parentNode.insertBefore(li,textarea.parentNode);
 //  window.scrollTo(0,document.body.scrollHeight);
}

function makeResponse(sLine) {
  makeLi(sLine,'response');
}

function makeRequest(sLine) {
  makeLi(sLine,'request');
}

//htmlconnector.setAnswerHook(function(sLine) {
//    makeResponse(sLine);
//});

function moveCaretToEnd(el) {
  if (typeof el.selectionStart == 'number') {
    el.selectionStart = el.selectionEnd = el.value.length;
  } else if (typeof el.createTextRange != 'undefined') {
    el.focus();
    var range = el.createTextRange();
    range.collapse(false);
    range.select();
  }
}
function moveCursorToEnd(textarea) {
  moveCaretToEnd(textarea);
    // Work around Chrome's little problem
  window.setTimeout(function() {
    moveCaretToEnd(textarea);
  }, 1);
}

textarea.addEventListener('change',updateText);
textarea.addEventListener('paste',updateText);
textarea.addEventListener('keyup',updateText);

textarea.addEventListener('keydown',function(e) {
  if (e.key === 'F12') {
    //remote.getCurrentWindow().webContents.toggleDevTools();
  }
  if (e.key === 'Enter') {
    var value = textarea.value;
    inputHistory.push(value);
    textarea.value = '';
    var li = document.createElement('li');
    var div = document.createElement('div');
    li.appendChild(div);
    li.classList.add('common');
    li.classList.add('request');
    div.classList.add('common');
    div.classList.add('request');
    div.innerText = value;
    textarea.parentNode.parentNode.insertBefore(li,textarea.parentNode);
    setTimeout(function() {
      textarea.value = '';
      var r = value.substring(0,940).split(';');
      r.forEach(s => {
        s = s.trim();
        if(s.length) {
          htmlconnector.processMessage({ sourcedest : 'EXEC', statement : s + ';'} );
        }
      })
    }, 10);
  }
  else
 if ( e.key === 'ArrowUp' || e.key === 'Up') {
   var r = inputHistory.backward(textarea.value);
   if(r !== undefined) {
     textarea.value = r;
     moveCursorToEnd(textarea);
   }
 }
 else
 if ( e.key === 'ArrowDown' || e.key === 'Down') {
   var res = inputHistory.forward(textarea.value);
   if(res !== undefined ) {
     textarea.value = res;
     moveCursorToEnd(textarea);
   }
 } else {


 }
  //alert("got a keypress" + JSON.stringify({ key : e.key}) + " x " + e.keyCode + " / " +
  //(e.key === "ArrowUp" )
  //);
}, false);


document.addEventListener('DOMContentLoaded', function(event) {
  //do work
    // WebSocket
  var socket = io.connect();
  socket.on('sqlclient', function (data) {
    console.log('here data' + JSON.stringify(data));
    if(data.sourcedest == 'CHART') {
      addChartRecord(data.body.record);
    } else {
      makeResponse(data.body);
    }
    if(data.command && data.command.url) {
      window.open(data.command.url); // ,'_blank');
    }
    /*
      var zeit = new Date(data.zeit);
      $('#content').append(
            $('<li></li>').append(
                // Uhrzeit
                $('<span>').text('[' +
                    (zeit.getHours() < 10 ? '0' + zeit.getHours() : zeit.getHours())
                    + ':' +
                    (zeit.getMinutes() < 10 ? '0' + zeit.getMinutes() : zeit.getMinutes())
                    + '] '
                ),
                // Name
                $('<b>').text(typeof(data.name) != 'undefined' ? data.name + ': ' : ''),
                // Text
                $('<span>').text(data.text))
        );
        // nach unten scrollen
      $('body').scrollTop($('body')[0].scrollHeight);

  */
  });
    // Nachricht senden
  function processMessage(oString){
    var name = 'unkown';
    var conversationid = document.getElementsByName('conversationid')[0].content;
      // send
    socket.emit('sqlclient', { name: name, body : oString, conversationid : conversationid });
  }
    // bei einem Klick
  window.htmlconnector = {
    processMessage : processMessage
  };
});


function updateParallel(value)
{
  settings.parallel = value;
  htmlconnector.processMessage(
    { sourcedest : 'PAR' , statement :
        textarea.value,
      op: 'CHANGE',
      settings : settings
    });
}

var settings = {
  continuous : false,
  parallel: 1
};


$(document).ready(function(){

// confirm account deletion //
  $('#btninc').click(function(){
    $('#parallel').setValue(  $('#parallel').getValue() + 1 );
  });

  $('#btndecpar').click(function(){
    var value =  parseInt($('#parallel').val()) - 1;
    if( value > 0) {
      $('#parallel').val( value );
      updateParallel(value);
    }
  });

  $('#btncontinuous').click(function(){
    settings.continuous = !settings.continuous;
    $('#btncontinuous').text( settings.continuous ? 'stop' : 'continuous');

    htmlconnector.processMessage(
      { sourcedest : 'PAR' , statement :
          textarea.value,
        op:  settings.continuous ? 'START' : 'STOP',
        settings : settings
      });
  });

  $('#btnexec').click(function(){
    htmlconnector.processMessage( { sourcedest : 'EXEC' , statement :
     textarea.value});
  });


  $('#parallel').on('change paste keyup', function() {
    var val = 1;
    try {
      val = parseInt($('parallel').val());
    } catch(e) {
      $('parallel').val(1);
    }
    if ( '' + val != '' + $('parallel').val()) {
      $('parallel').val(val);
    }
    settings.parallel = val;
    updateParallel($(this).val());
  });

  $('#btnincpar').click(function(){
    var value =  parseInt($('#parallel').val()) + 1;
    if( value > 0) {
      $('#parallel').val( value );
      updateParallel(value);
    }
  });


  $('#btnPurgeSample').click(function(){
    removeHalfData(true);
  });
  $('#btnPurgeAverage').click(function(){
    removeHalfData(false);
  });
  $('#btnPurgeLeftHalf').click(function(){
    removeHalfDataLeft();
  });

  $('#btnMEM').click(function(){    toggleColumn('MEM'); });
  $('#btnMAXMEM').click(function(){    toggleColumn('MAXMEM'); });
  $('#btnPAR').click(function(){    toggleColumn('PAR'); });
  $('#btnCPU').click(function(){    toggleColumn('CPU'); });
  $('#btnQPS').click(function(){    toggleColumn('QPS'); });
  $('#btnNP').click(function(){    toggleColumn('NP'); });
  $('#btnDUR').click(function(){    toggleColumn('DUR'); });
  $('#btnFAIL').click(function(){    toggleColumn('FAIL'); });

});



// handle account deletion //
$('.modal-confirm .submit').click(function(){ that.deleteAccount(); });
