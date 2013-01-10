/********************************************************************
* Limit the characters that may be entered in a text field
* Common options: alphanumeric, alphabetic or numeric
* Kevin Sheedy, 2012
* http://github.com/KevinSheedy/jquery.alphanum
*********************************************************************/
(function( $ ){

	// API ///////////////////////////////////////////////////////////////////
	$.fn.alphanum = function(settings) {
		
		var combinedSettings = getCombinedSettingsAlphaNum(settings);

		var $collection = this;

		setupEventHandlers($collection, trimAlphaNum, combinedSettings);
	};
	
	$.fn.alpha = function(settings) {
		
		var defaultAlphaSettings = getCombinedSettingsAlphaNum("alpha");
		var combinedSettings = getCombinedSettingsAlphaNum(settings, defaultAlphaSettings);

		var $collection = this;

		setupEventHandlers($collection, trimAlphaNum, combinedSettings);
	};
	
	$.fn.numeric = function(settings) {
		
		var combinedSettings = getCombinedSettingsNum(settings);
		var $collection = this;

		setupEventHandlers($collection, trimNum, combinedSettings);
		
	};
	
	// End of API /////////////////////////////////////////////////////////////
	
	
	// Start Settings ////////////////////////////////////////////////////////
	
	var DEFAULT_SETTINGS_ALPHANUM = {
		allow              : '',   // Allow extra characters
		disallow           : '',   // Disallow extra characters
		allowSpace         : true, // Allow the space character
		allowNumeric       : true, // Allow digits 0-9
		allowUpper         : true, // Allow upper case characters
		allowLower         : true, // Allow lower case characters
		allowCaseless      : true, // Allow characters that don't have both upper & lower variants - eg Arabic or Chinese
		allowLatin         : true, // a-z A-Z
		allowOtherCharSets : true  // eg �, �, Arabic, Chinese etc
	}
	
	var DEFAULT_SETTINGS_NUM = {
		allowPlus           : false, // Allow the + sign
		allowMinus          : true,  // Allow the - sign
		allowThouSep        : true,  // Allow the thousands separator, default is the comma eg 12,000
		allowDecSep         : true,  // Allow the decimal separator, default is the fullstop eg 3.141
		allowLeadingSpaces  : false,
		maxDigits           : '',    // The max number of digits or '' for no max
		maxDecimalPlaces    : '',    // The max number of decimal places or '' for no max
		maxPreDecimalPlaces : ''     // The max number digits before the decimal point or '' for no max
	}
	
	// Some pre-defined groups of settings for convenience
	var CONVENIENCE_SETTINGS_ALPHANUM = {
		"alpha" : {
			allowNumeric  : false
		},
		"upper" : {
			allowNumeric  : false,
			allowUpper    : true,
			allowLower    : false,
			allowCaseless : true
		},
		"lower" : {
			allowNumeric  : false,
			allowUpper    : false,
			allowLower    : true,
			allowCaseless : true
		}
	};

	// Some pre-defined groups of settings for convenience
	var CONVENIENCE_SETTINGS_NUMERIC = {
		"integer" : {
			allowPlus    : false,
			allowMinus   : true,
			allowThouSep : false,
			allowDecSep  : false
		},
		"positiveInteger" : {
			allowPlus    : false,
			allowMinus   : false,
			allowThouSep : false,
			allowDecSep  : false
		}
	};
	
	
	var BLACKLIST   = getBlacklistAscii() + getBlacklistNonAscii();
	var THOU_SEP    = ",";
	var DEC_SEP     = ".";
	var DIGITS      = getDigitsMap();
	var LATIN_CHARS = getLatinCharsSet();
	
	// Return the blacklisted special chars that are encodable using 7-bit ascii
	function getBlacklistAscii(){
		var blacklist = '!@#$%^&*()+=[]\\\';,/{}|":<>?~`.- _';
		return blacklist;
	}
	
	// Return the blacklisted special chars that are NOT encodable using 7-bit ascii
	// We want this .js file to be encoded using 7-bit ascii so it can reach the widest possible audience
	// Higher order chars must be escaped eg "\xAC"
	// Not too worried about comments containing higher order characters for now (let's wait and see if it becomes a problem)
	function getBlacklistNonAscii(){
		var blacklist = 
			  "\xAC"     // �
			+ "\u20AC"   // �
			+ "\xA3"     // �
			;
		return blacklist;
	}
	
	// End Settings ////////////////////////////////////////////////////////
	
	
	// Implementation details go here ////////////////////////////////////////////////////////

	function setupEventHandlers($textboxes, trimFunction, settings) {

		$textboxes.each(function(){

			var $textbox = $(this);

			$textbox.bind("keyup change paste", function(){

				// setTimeout is necessary for handling the 'paste' event
				setTimeout(function(){
					trimTextbox($textbox, trimFunction, settings);
				}, 0);
			});

			$textbox.bind("keypress", function(e){

				var start = $textbox.prop("selectionStart");
				var end   = $textbox.prop("selectionEnd");

				var textBeforeKeypress         = $textbox.val();
				var charCode                   = !e.charCode ? e.which : e.charCode;
				var newChar                    = String.fromCharCode(charCode);

				if(isControlKey(charCode))
					return;
				
				// The new char may be inserted:
				//  1) At the start
				//  2) In the middle
				//  3) At the end
				//  4) User highlights some text and then presses a key which would replace the highlighted text
				//
				// Here we build the string that would result after the keypress.
				// If the resulting string is invalid, we cancel the event.
				// Unfortunately, it isn't enough to just check if the new char is valid because some chars
				// are position sensitive eg the decimal point '.'' or the minus sign '-'' are only valid in certain positions.
				var potentialTextAfterKeypress = textBeforeKeypress.substring(0, start) + newChar + textBeforeKeypress.substring(end);
				var validatedText              = trimFunction(potentialTextAfterKeypress, settings);

				// If the keypress would cause the textbox to contain invalid characters, then cancel the keypress event
				if(validatedText != potentialTextAfterKeypress)
					e.preventDefault();
			});
		});

	}

	function isControlKey(charCode) {

		if(charCode >= 32)
			return false;
		if(charCode == 10)
			return false;
		if(charCode == 13)
			return false;

		return true;
	}
	
	// One way to prevent a character being entered is to cancel the keypress event.
	// However, this gets messy when you have to deal with things like copy paste which isn't a keypress.
	// Which event gets fired first, keypress or keyup? What about IE6 etc etc?
	// Instead, it's easier to allow the 'bad' character to be entered and then to delete it immediately after.
	
	function trimTextbox($textBox, trimFunction, settings){
		
		var inputString = $textBox.val();
		var outputString = trimFunction(inputString, settings);
		
		if(inputString == outputString)
			return;
		
		var caretPos = $textBox.caret();
		
		$textBox.val(outputString);
		
		//Reset the caret position
		if(inputString.length ==(outputString.length + 1))
			$textBox.caret(caretPos - 1);
		else
			$textBox.caret(caretPos);
	}
	
	function getCombinedSettingsAlphaNum(settings, defaultSettings){
		if(typeof defaultSettings == "undefined")
			defaultSettings = DEFAULT_SETTINGS_ALPHANUM;
		var userSettings, combinedSettings = {};
		if(typeof settings === "string")
			userSettings = CONVENIENCE_SETTINGS_ALPHANUM[settings];
		else if(typeof settings == "undefined")
			userSettings = {};
		else
			userSettings = settings;
		
		$.extend(combinedSettings, defaultSettings, userSettings);
		
		if(typeof combinedSettings.blacklist == 'undefined')
			combinedSettings.blacklistSet = getBlacklistSet(combinedSettings.allow, combinedSettings.disallow);
		
		return combinedSettings;
	}
	
	function getCombinedSettingsNum(settings){
		var userSettings, combinedSettings = {};
		if(typeof settings === "string")
			userSettings = CONVENIENCE_SETTINGS_NUMERIC[settings];
		else if(typeof settings == "undefined")
			userSettings = {};
		else
			userSettings = settings;
		
		$.extend(combinedSettings, DEFAULT_SETTINGS_NUM, userSettings);
		
		return combinedSettings;
	}
	
	
	// This is the heart of the algorithm
	function alphanum_allowChar(Char, settings){
		
		if(settings.allowSpace && (Char == " "))
			return true;
			
		if(settings.blacklistSet.contains(Char))
			return false;
		
		if(!settings.allowNumeric && DIGITS[Char])
			return false;
			
		if(!settings.allowUpper && isUpper(Char))
			return false;
			
		if(!settings.allowLower && isLower(Char))
			return false;
			
		if(!settings.allowCaseless && isCaseless(Char))
			return false;
		
		if(!settings.allowLatin && LATIN_CHARS.contains(Char))
			return false;
		
		
		if(!settings.allowOtherCharSets){
			if(DIGITS[Char] || LATIN_CHARS.contains(Char))
				return true;
			else
				return false;
		}
		
		return true;
	}
	
	function numeric_allowChar(validatedStringFragment, Char, settings){

		if(DIGITS[Char]) {

			if(isMaxDigitsReached(validatedStringFragment, settings))
				return false;

			if(isMaxPreDecimalsReached(validatedStringFragment, settings))
				return false;

			if(isMaxDecimalsReached(validatedStringFragment, settings))
				return false;

			return true;
		}

		if(settings.allowPlus && Char == '+' && validatedStringFragment == '')
			return true;

		if(settings.allowMinus && Char == '-' && validatedStringFragment == '')
			return true;

		if(Char == THOU_SEP)
			return true;

		if(Char == DEC_SEP)
			return true;
		
		return false;
	}

	function countDigits(string) {

		// Error handling, nulls etc
		string = string + "";

		// Count the digits
		return string.replace(/[^0-9]/g,"").length;
	}

	function isMaxDigitsReached(string, settings) {

		var maxDigits = settings.maxDigits;

		if(maxDigits == "" || isNaN(maxDigits))
			return false; // In this case, there is no maximum

		var numDigits = countDigits(string);

		if(numDigits >= maxDigits)
			return true;

		return false;
	}

	function isMaxDecimalsReached(string, settings) {

		var maxDecimalPlaces = settings.maxDecimalPlaces;

		if(maxDecimalPlaces == "" || isNaN(maxDecimalPlaces))
			return false; // In this case, there is no maximum

		var indexOfDecimalPoint = string.indexOf(DEC_SEP);

		if(indexOfDecimalPoint == -1)
			return false;

		var decimalSubstring = string.substring(indexOfDecimalPoint);
		var numDecimals = countDigits(decimalSubstring);

		if(numDecimals >= maxDecimalPlaces)
			return true;

		return false;
	}

	function isMaxPreDecimalsReached(string, settings) {

		var maxPreDecimalPlaces = settings.maxPreDecimalPlaces;

		if(maxPreDecimalPlaces == "" || isNaN(maxPreDecimalPlaces))
			return false; // In this case, there is no maximum

		var indexOfDecimalPoint = string.indexOf(DEC_SEP);

		if(indexOfDecimalPoint >= 0)
			return false;

		var numPreDecimalDigits = countDigits(string);

		if(numPreDecimalDigits >= maxPreDecimalPlaces)
			return true;

		return false;
	}
	
	/********************************
	 * Trims a string according to the settings provided
	 ********************************/
	function trimAlphaNum(inputString, settings){
		
		if(typeof inputString != "string")
			return inputString;
		
		var inChars = inputString.split("");
		var outChars = [];
		var i = 0;
		var Char;
		
		for(i=0; i<inChars.length; i++){
			Char = inChars[i];
			if(alphanum_allowChar(Char, settings))
				outChars.push(Char);
		}
		
		return outChars.join("");
	}
	
	function trimNum(inputString, settings){
		if(typeof inputString != "string")
			return inputString;
		
		var inChars = inputString.split("");
		var outChars = [];
		var i = 0;
		var Char;
		
		for(i=0; i<inChars.length; i++){
			Char = inChars[i];
			var validatedStringFragment = outChars.join("");
			if(numeric_allowChar(validatedStringFragment, Char, settings))
				outChars.push(Char);
		}
		
		return outChars.join("");
	}
	
	function removeUpperCase(inputString){
		var charArray = inputString.split('');
		var i = 0;
		var outputArray = [];
		var Char;
		
		for(i=0; i<charArray.length; i++){
			Char = charArray[i];
		}
	}
	
	function removeLowerCase(inputString){
		
	}
	
	function isUpper(Char){
		var upper = Char.toUpperCase();
		var lower = Char.toLowerCase();
		
		if( (Char == upper) && (upper != lower))
			return true;
		else
			return false;
	}
	
	function isLower(Char){
		var upper = Char.toUpperCase();
		var lower = Char.toLowerCase();
		
		if( (Char == lower) && (upper != lower))
			return true;
		else
			return false;
	}
	
	function isCaseless(Char){
		if(Char.toUpperCase() == Char.toLowerCase())
			return true;
		else
			return false;
	}
	
	function getBlacklistSet(allow, disallow){
		
		var setOfBadChars  = new Set(BLACKLIST + disallow);
		var setOfGoodChars = new Set(allow);
		
		var blacklistSet   = setOfBadChars.subtract(setOfGoodChars);
		
		return blacklistSet;
	}
	
	function getDigitsMap(){
		var array = "0123456789".split("");
		var map = {};
		var i = 0;
		var digit;
		
		for(i=0; i<array.length; i++){
			digit = array[i];
			map[digit] = true;
		}
		
		return map;
	}
	
	function getLatinCharsSet(){
		var lower = "abcdefghijklmnopqrstuvwxyz";
		var upper = lower.toUpperCase();
		var azAZ = new Set(lower + upper);
		
		return azAZ;
	}
	
	////////////////////////////////////////////////////////////////////////////////////
	// Implementation of a Set
	////////////////////////////////////////////////////////////////////////////////////
	function Set(elems){
		if(typeof elems == "string")
			this.map = stringToMap(elems);
		else
			this.map = {};
	}
	
	Set.prototype.add = function(set){
	
		var newSet = this.clone();
		
		for(key in set.map)
			newSet.map[key] = true;
		
		return newSet;
	}
	
	Set.prototype.subtract = function(set){
		
		var newSet = this.clone();
		
		for(key in set.map)
			delete newSet.map[key];
			
		return newSet;
	}
	
	Set.prototype.contains = function(key){
		if(this.map[key])
			return true;
		else
			return false;
	}
	
	Set.prototype.clone = function(){
		var newSet = new Set();
		
		for(key in this.map)
			newSet.map[key] = true;
		
		return newSet;
	}
	////////////////////////////////////////////////////////////////////////////////////
	
	function stringToMap(string){
		var map = {};
		var array = string.split("");
		var i=0;
		var Char;
		
		for(i=0; i<array.length; i++){
			Char = array[i];
			map[Char] = true;
		}
		
		return map;
	}
	
	// Backdoor for testing
	$.fn.alphanum.backdoorAlphaNum = function(inputString, settings){
		var combinedSettings = getCombinedSettingsAlphaNum(settings);
		
		return trimAlphaNum(inputString, combinedSettings);
	};
	
	$.fn.alphanum.backdoorNumeric = function(inputString, settings){
		var combinedSettings = getCombinedSettingsNum(settings);
		
		return trimNum(inputString, combinedSettings);
	};
})( jQuery );


//Include the 3rd party lib: jquery.caret.js


// Set caret position easily in jQuery
// Written by and Copyright of Luke Morton, 2011
// Licensed under MIT
(function ($) {
	// Behind the scenes method deals with browser
	// idiosyncrasies and such
	$.caretTo = function (el, index) {
		if (el.createTextRange) { 
			var range = el.createTextRange(); 
			range.move("character", index); 
			range.select(); 
		} else if (el.selectionStart != null) { 
			el.focus(); 
			el.setSelectionRange(index, index); 
		}
	};
	
	// Another behind the scenes that collects the
	// current caret position for an element
	
	// TODO: Get working with Opera
	$.caretPos = function (el) {
		if ("selection" in document) {
			var range = el.createTextRange();
			try {
				range.setEndPoint("EndToStart", document.selection.createRange());
			} catch (e) {
				// Catch IE failure here, return 0 like
				// other browsers
				return 0;
			}
			return range.text.length;
		} else if (el.selectionStart != null) {
			return el.selectionStart;
		}
	};

	// The following methods are queued under fx for more
	// flexibility when combining with $.fn.delay() and
	// jQuery effects.

	// Set caret to a particular index
	$.fn.caret = function (index, offset) {
		if (typeof(index) === "undefined") {
			return $.caretPos(this.get(0));
		}
		
		return this.queue(function (next) {
			if (isNaN(index)) {
				var i = $(this).val().indexOf(index);
				
				if (offset === true) {
					i += index.length;
				} else if (typeof(offset) !== "undefined") {
					i += offset;
				}
				
				$.caretTo(this, i);
			} else {
				$.caretTo(this, index);
			}
			
			next();
		});
	};

	// Set caret to beginning of an element
	$.fn.caretToStart = function () {
		return this.caret(0);
	};

	// Set caret to the end of an element
	$.fn.caretToEnd = function () {
		return this.queue(function (next) {
			$.caretTo(this, $(this).val().length);
			next();
		});
	};
}(jQuery));