
/**
 *  == fx ==
 *  The FX section
**/

/** section: fx
 * FX
 **/
 
// Namespace
FX = {};

// t: current time, b: begInnIng value, c: change In value, d: duration
FX.Transition = {
	swing: function( x, t, b, c, d) {
		return ((-Math.cos(t/d*Math.PI)/2) + 0.5) * c + b;
	}
}


FX.DefaultOptions = {duration: 500, transition: FX.Transition.swing, eventNotifier: document, memoData: null};
/** 
 *  class FX.Base
 *
 * Base class for any kind of FX.  
 *  
 **/
FX.Base = Class.create((function() {
  /** 
   *  new FX.Base([options])
   **/
  function initialize(options) {
    this.options     = Object.extend(Object.clone(FX.DefaultOptions), options);
    this.currentTime = null;
    this.nextTime    = 0;
    this.playing     = false;
    this.backward    = false;
    this.callbacks   = {onEnded: Prototype.emptyFunction, onStarted: Prototype.emptyFunction}
    this.setOptions(options);
  }
  
  /** 
   *  FX.Base#setOptions(options) -> FX.Base
   **/
  function setOptions(options) {
    Object.extend(this.options, options || {});  
    return this; 
  }
  
  /** 
   *  FX.Base#getDuration() -> int
   **/
  function getDuration() {
    return this.options.duration;
  }
  
  /** 
   *  FX.Base#isPlaying() -> true/false
   **/
  function isPlaying() {
    return this.playing;
  }
  
  /** 
   *  FX.Base#play() -> FX.Base
   *  
   *  Starts animation from current position
   *  fires fx:started
   **/
  function play() {
    if (this.playing) return;
      
    this.fire('beforeStarted');
    this.playing = true;

    // Reset time for a new play
    if (this.currentTime == null) {
      this.currentTime = this.backward ? this.getDuration() : 0;
      this.startAnimation(this.backward);
    }

    // Add it to metronome to receive recurring updateAnimation
    FX.Metronome.register(this);

    this.fire('started');
    return this;
  }
  
  /** 
   *  FX.Base#stop() -> FX.Base
   *  
   *  Stops animation at current running position
   *  fires fx:stopped
   **/
  function stop() {
    this.fire('stopped');
    FX.Metronome.unregister(this);
    this.playing = false;
    return this;
  }
  
  /** 
   *  FX.Base#reverse() -> FX.Base
   *  
   *  Reverses animation. If animation is running, it keeps running backward
   *  fire fx:reversed
   **/
  function reverse() {
    this.fire('reversed');
    this.backward = !this.backward;
    return this;
  }
  
  /** 
   *  FX.Base#rewind() -> FX.Base
   *  
   *  Rewind animation. Depending on animation direction it goes to begin or end position
   *  fires fx:rewinded
   **/
  function rewind() {
    // Stop before rewinding
    this.stop();
    this.fire('rewinded');
    this.updateAnimation(this.backward ? 1 : 0);
    this.currentTime = null;
    return this;
  }

  // Function called periodically by Metronome
  function metronomeUpdate(delta) {
    // Update current time
    this.currentTime += this.backward ? -delta : delta;
        
    // Unregister from FX.Metronome if time is out of range
    if (this.currentTime > this.getDuration() || this.currentTime < 0) {
      // Force update to last position
      this.updateAnimation(this.currentTime < 0 ? 0 : 1);
      this.stopAnimation();
      this.fire('ended');

      FX.Metronome.unregister(this);
      
      this.currentTime = null;
      this.playing   = false;
    }
    else {
      var pos = this.options.transition(this.currentTime / this.getDuration(), this.currentTime, 0, 1, this.getDuration());
      this.updateAnimation(pos);
    }
  }
  
  function onEnded(callback) {
    this.callbacks.onEnded = callback;
    return this;
  }
  
  function onStarted(callback) {
    this.callbacks.onStarted = callback;
    return this;
  }
  
  function onBeforeStarted(callback) {
    this.callbacks.onBeforestarted = callback;
    return this;
  }
  
  function fire(eventName) {
    var callback;
    if (callback = this.callbacks['on'+ eventName.capitalize()]) callback();
    this.options.eventNotifier.fire('fx:' + eventName, {fx: this, data: this.memoData});
  }

  // Internal callbacks for subclasses
  // Get (or create) linked group
  function updateAnimation(pos) {
    throw 'FX.Base#updateAnimation(pos) must be implemented'
  }
 
  return {           
    initialize:      initialize,
    setOptions:      setOptions,
    getDuration:     getDuration,
    play:            play,
    stop:            stop,
    reverse:         reverse,
    rewind:          rewind,
    isPlaying:       isPlaying,
    metronomeUpdate: metronomeUpdate,
    startAnimation:  Prototype.emptyFunction,
    stopAnimation:   Prototype.emptyFunction,
    updateAnimation: updateAnimation,
    fire:            fire,
    onStarted:       onStarted,
    onEnded:         onEnded,
    onBeforeStarted: onBeforeStarted
  }
})());

/** section: fx
 *  class FX.Attribute
 *  
 **/
 FX.Attribute = Class.create((function() {
   /** 
    *  new FX.Attribute(key, from, to)
    *  - key (String): attribute name
    *  - from (String | Number): from value. It could be a String fo a Color rgb(R,G,B) or a value like 400 or 400px
    *  For a Number value, it can include an operator (+=, -=, /= nd *=)
    *  
    *  Creates a new FX.Attribute for a given key
    **/
  function initialize(key, from, to) {
    this.key    = key;
    this.from   = from;
    this.to     = to;
    this.type   = computeType(this.from);
    this.unit   = computeUnit(this.from);
    this.fromFX = computeFromFX(this.from, this.isColor());
    this.toFX   = computeToFX(this);
  }
  
  /** 
   *  FX.Attribute#convert(pos) -> (Number | String)
   *  - pos (Number): position between 0 and 1 to compute value between from and to.
   *  returns: converted value. A Number or a String for a Color (rgb(R,G,B))
   **/
  function convert(pos) {
    if (this.isNumber()) 
      return convertValue(this.fromFX, this.toFX, pos) + this.unit;
    // Else it's a color
    else {
      var r = parseInt(convertValue(this.fromFX[0], this.toFX[0], pos));
      var g = parseInt(convertValue(this.fromFX[1], this.toFX[1], pos));
      var b = parseInt(convertValue(this.fromFX[2], this.toFX[2], pos));
      return "rgb(" + r + ", " + g + ", " + b + ")";
    }
  }

  /** 
   *  FX.Attribute#isColor() -> true/false
   *  Returns true if this attribute represents a Color (rgb value), else returns false
   **/
  function reset(from, backward) {
    if (from && this.relative)
      this.from = from;
    this.fromFX = computeFromFX(this.from, this.isColor());
    this.relative = false;
    
    this.toFX   = computeToFX(this, backward);
    if (backward && this.relative) {
      var tmp = this.fromFX;
      this.fromFX = this.toFX, this.toFX = tmp;
    };
  }
  
  /** 
   *  FX.Attribute#isColor() -> true/false
   *  Returns true if this attribute represents a Color (rgb value), else returns false
   **/
  function isColor() {
    return this.type == 'Color'
  }
  
  /** 
   *  FX.Attribute#isNumber() -> true/false
   *  Returns true if this attribute represents a number like 400, 400px else returns false
   **/
  function isNumber() {
    return this.type == 'Number'
  }
  
  // PRIVATE FUNCTIONS
  function computeType(value) {
    if (Object.isString(value) && value.isColor())
      return 'Color'
    else
      return 'Number'
  }
  
  function computeUnit(from) {
    var match;
    if (Object.isString(from) && (match = from.match(/(\d+)([\w\%]*)/)))
      return match[2];
    else
      return '';
  }
  
  function computeFromFX(from, color) {
    if (color) 
      return from.getRGB();
    else if (Object.isString(from))
      return parseFloat(from);
    else
      return from;
  }
  
  function computeToFX(attribute, backward) {
    if (attribute.isColor())
      return attribute.to.getRGB();
    else if (Object.isString(attribute.to)) {
      if (isOperator(attribute.to))
        return _computeOperator(attribute, backward);
      else
        return parseFloat(attribute.to);
    }
    else
      return attribute.to;
  }
  
  // Convert a number value
  function convertValue(from, to, pos) {
    return from + (to - from) * pos;
  }
  
  function isOperator(string) {
    return string.match(/^([\+\-\*\/]=)(\d*)$/);
  }
  
  function _computeOperator(attribute, backward) {
    attribute.relative = true;
    var match = isOperator(attribute.to);

    if ((backward && match[1] == '-=') || (!backward && match[1] == '+='))
      return attribute.fromFX + parseFloat(match[2]);
    else if ((backward && match[1] == '+=') || (!backward && match[1] == '-='))
      return attribute.fromFX - parseFloat(match[2]);
    else if ((backward && match[1] == '*=') || (!backward && match[1] == '/='))
      return attribute.fromFX / parseFloat(match[2]);
    else if ((backward && match[1] == '/=') || (!backward && match[1] == '*='))
      return attribute.fromFX * parseFloat(match[2]);
    else
      throw 'Operator ' + match[1] + ' not allowed';
  }
  
  return {
    initialize: initialize,
    convert:    convert,
    reset:      reset,
    isNumber:   isNumber,
    isColor:    isColor
  };
})());

/** section: fx
  * FX.Metronome
  **/
FX.Metronome = (function() {
  var timer     = null, 
      frequency = 1000/60,
      lastTick  = null,
      objects   = new Array();
  
  /** 
   *  FX.Metronome#register(object) -> Undefined
   *  - object 
   *  Adds a new object to metronome. Object must respond to metronomeUpdate
   **/
  function register(object) {
    if (!isRegistered(object)) {
      objects.push(object);
      play();
    }
  }
  
  /** 
   *  FX.Metronome#unregister(object) -> Undefined
   *  Removes a object from metronome. 
   **/
  function unregister(object) {
    objects = objects.reject(function(item) { return item == object; });

    // Stop metronome if there is no more objects to execute
    if (objects.length == 0)
      stop();
  }
  
  /** 
   *  FX.Metronome#isRegistered(object) -> true/false
   *  Checks if an object is registered in the metronome. 
   **/
  function isRegistered(object) {
    return objects.find(function(item) { return item == object; });
  }
  
  // Internal Functions
  
  // Start metronome (if not already running)
  function play() {
    if (timer == null) {
      lastTick = new Date().getTime();
      // Start timer
      timer    = setInterval(tick, frequency);
      // Run first tick
      tick();
    }
  }
  
  // Stop metronome if running
  function stop() {
    if (timer) {
      // Stop timer
      clearInterval(timer);
      timer    = null;
      lastTick = 0;
    }
  }
  
  // Tick callback (called periodically)
  function tick() {
    // Adjust metronome with current time
    var now   = new Date().getTime();
    var delta = now - lastTick;
    lastTick  = now;
    // Update all running objects 
    objects.invoke('metronomeUpdate', delta);
  }
  
  // Publish Metronome public methods
  return {
    register:     register,
    unregister:   unregister,
    isRegistered: isRegistered
  }
})();


Object.extend(String.prototype, {
  isColor: function() {
    // Should begin with # or rgb(
   return this.match(/^\#/) || this.match(/^rgb\(/);
  },

  // return an array of 3 integer values (red, green, blue) 0 <= rgb < 256
  getRGB: function() {
    function toDec(string) {
      if (string.length == 1)
        string += string;
      return parseInt(string, 16);
    }
  
    if (this.isColor()) {
      var match;

      // Check rgb(r,g,b) format
      if (match = this.match(/(^rgb\()(\d+), (\d+), (\d+)(\))/i)) 
        return [parseInt(match[2]), parseInt(match[3]), parseInt(match[4])];
      
      // Check #xxx format 
      if (match = this.match(/^\#([0-9a-f]{1})([0-9a-f]{1})([0-9a-f]{1})$/i)) {
        return match.slice(1).collect(toDec);
      }

      // Check #xxxxxx format 
      if (match = this.match(/^\#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)) 
        return match.slice(1).collect(toDec);
    }    
    return null;
  }
});

/** 
 *  class FX.Element
 *  
 **/
FX.Element = Class.create(FX.Base, (function() {

  /** 
   *  new FX.Element(element[, options])
   *  
   **/
  function initialize($super, element, options) {
    $super(options);
    this.element = $(element);
  }
  
  function animate(attributes) {
    this.originalAttributes = attributes;    
    return this;
  }
  
  function cloneFor(element) {
    var fx = new FX.Element(element, this.options).animate(this.originalAttributes);
    fx.callbacks = this.callbacks;
    return fx;
  }
    
  // FX.Score callbacks
  function startAnimation(backward) {
    this.attributes = this.attributes || prepareAttributes(this.originalAttributes, this.element);

    this.attributes.each(function(attribute) {
      attribute.reset(this.element.getStyle(attribute.key), backward);
    }, this);
  }
  
  function updateAnimation(pos) {
    var style = {};
    this.attributes.each(function(attribute) {
      style[attribute.key] = attribute.convert(pos);
    }, this);
    this.element.setStyle(style);
  }
    
  // PRIVATE FUNCTIONS
  // Parse all attributes and create FX.attribute for each
  function prepareAttributes(attributes, element) {
    var array = [];
    $H(attributes).each(function(item) {
      array.push(new FX.Attribute(item.key, element.getStyle(item.key), item.value));
    });
    
    return array;
  }
  return {
    initialize:      initialize,
    animate:         animate,
    cloneFor:        cloneFor, 
    startAnimation:  startAnimation,
    updateAnimation: updateAnimation
  }
})());


Element.addMethods({
  fade: function(element, options) {
    new FX.Element(element)
      .setOptions(options || {})
      .animate({opacity: 0})
      .play();
    return element;
  },
  
  appear: function(element, options) {
    new FX.Element(element)
      .setOptions(options || {})
      .animate({opacity: 1})
      .play();
    return element;
  },
  
  blindUp: function(element, options) {
    if (!element.visible()) return;
    
    new FX.Element(element)
      .setOptions(options || {})
      .onBeforeStarted(function() {element.originalHeight = element.style.height})
      .onEnded(function() {element.hide(); element.style.height = element.originalHeight; (element.originalHeight)})
      .animate({height: 0})
      .play();
    return element;
  },
  
  blindDown: function(element, options) {
    if (element.visible()) return;
    var height = element.getHeight();
    new FX.Element(element)
      .setOptions(options || {})
      .onBeforeStarted(function() {element.show(); element.style.height = '0px'})
      .animate({height: height + 'px'})
      .play();
    return element;
  }
  
})
// t: current time, b: begInnIng value, c: change In value, d: duration
Object.extend(FX.Transition, {
	linear: function(x, t, b, c, d) {
		return c*t/d + b;
	},
	sinus: function( x, t, b, c, d) {
		return Math.sin(t/d*2*Math.PI) * c + b;
	},
	cosinus: function( x, t, b, c, d) {
		return Math.cos(t/d*2*Math.PI) * c + b;
	},
	easeInQuad: function (x, t, b, c, d) {
  	return c*(t/=d)*t + b;
  },
  easeOutQuad: function (x, t, b, c, d) {
  	return -c *(t/=d)*(t-2) + b;
  },
  easeInOutQuad: function (x, t, b, c, d) {
  	if ((t/=d/2) < 1) return c/2*t*t + b;
  	return -c/2 * ((--t)*(t-2) - 1) + b;
  },
  easeInCubic: function (x, t, b, c, d) {
  	return c*(t/=d)*t*t + b;
  },
  easeOutCubic: function (x, t, b, c, d) {
  	return c*((t=t/d-1)*t*t + 1) + b;
  },
  easeInOutCubic: function (x, t, b, c, d) {
  	if ((t/=d/2) < 1) return c/2*t*t*t + b;
  	return c/2*((t-=2)*t*t + 2) + b;
  },
  easeInQuart: function (x, t, b, c, d) {
  	return c*(t/=d)*t*t*t + b;
  },
  easeOutQuart: function (x, t, b, c, d) {
  	return -c * ((t=t/d-1)*t*t*t - 1) + b;
  },
  easeInOutQuart: function (x, t, b, c, d) {
  	if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
  	return -c/2 * ((t-=2)*t*t*t - 2) + b;
  },
  easeInQuint: function (x, t, b, c, d) {
  	return c*(t/=d)*t*t*t*t + b;
  },
  easeOutQuint: function (x, t, b, c, d) {
  	return c*((t=t/d-1)*t*t*t*t + 1) + b;
  },
  easeInOutQuint: function (x, t, b, c, d) {
  	if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
  	return c/2*((t-=2)*t*t*t*t + 2) + b;
  },
  easeInSine: function (x, t, b, c, d) {
  	return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
  },
  easeOutSine: function (x, t, b, c, d) {
  	return c * Math.sin(t/d * (Math.PI/2)) + b;
  },
  easeInOutSine: function (x, t, b, c, d) {
  	return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
  },
  easeInExpo: function (x, t, b, c, d) {
  	return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
  },
  easeOutExpo: function (x, t, b, c, d) {
  	return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
  },
  easeInOutExpo: function (x, t, b, c, d) {
  	if (t==0) return b;
  	if (t==d) return b+c;
  	if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
  	return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
  },
  easeInCirc: function (x, t, b, c, d) {
  	return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
  },
  easeOutCirc: function (x, t, b, c, d) {
  	return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
  },
  easeInOutCirc: function (x, t, b, c, d) {
  	if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
  	return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
  },
  easeInElastic: function (x, t, b, c, d) {
  	var s=1.70158;var p=0;var a=c;
  	if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
  	if (a < Math.abs(c)) { a=c; var s=p/4; }
  	else var s = p/(2*Math.PI) * Math.asin (c/a);
  	return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
  },
  easeOutElastic: function (x, t, b, c, d) {
  	var s=1.70158;var p=0;var a=c;
  	if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
  	if (a < Math.abs(c)) { a=c; var s=p/4; }
  	else var s = p/(2*Math.PI) * Math.asin (c/a);
  	return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
  },
  easeInOutElastic: function (x, t, b, c, d) {
  	var s=1.70158;var p=0;var a=c;
  	if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
  	if (a < Math.abs(c)) { a=c; var s=p/4; }
  	else var s = p/(2*Math.PI) * Math.asin (c/a);
  	if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
  	return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
  },
  easeInBack: function (x, t, b, c, d, s) {
  	if (s == undefined) s = 1.70158;
  	return c*(t/=d)*t*((s+1)*t - s) + b;
  },
  easeOutBack: function (x, t, b, c, d, s) {
  	if (s == undefined) s = 1.70158;
  	return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
  },
  easeInOutBack: function (x, t, b, c, d, s) {
  	if (s == undefined) s = 1.70158; 
  	if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
  	return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
  },
  easeInBounce: function (x, t, b, c, d) {
  	return c - FX.Transition.easeOutBounce (x, d-t, 0, c, d) + b;
  },
  easeOutBounce: function (x, t, b, c, d) {
  	if ((t/=d) < (1/2.75)) {
  		return c*(7.5625*t*t) + b;
  	} else if (t < (2/2.75)) {
  		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
  	} else if (t < (2.5/2.75)) {
  		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
  	} else {
  		return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
  	}
  },
  easeInOutBounce: function (x, t, b, c, d) {
  	if (t < d/2) return FX.Transition.easeInBounce (x, t*2, 0, c, d) * .5 + b;
  	return FX.Transition.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
  }
});
/*
 *
 * TERMS OF USE - EASING EQUATIONS
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © 2001 Robert Penner
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
 */
/** section: fx
 *  class FX.Score
 *  
 **/
FX.Score = Class.create(FX.Base, (function() {
  /** 
   *  new FX.Score()
   **/
  function initialize($super) {
    $super();
    this.duration  = 0;
    this.runningFx = new Array;
    this.effects   = new Array;
  }
  
  /** 
   *  FX.Base#getDuration() -> int
   *  
   **/
  function getDuration() {
    return this.duration;
  }
  
  /** 
   *  FX.Score#play() -> FX.Base
   *  
   **/
  function play($super) {
    if (this.playing)
      return;
      
    // Reset time for a new play
    if (this.currentTime == null)  {
      // this.rewind(true);
      computeRunningFxForTime(this, this.backward ? this.duration : 0);
    }

    return $super();
  }
  
  /** 
   *  FX.Score#reverse() -> FX.Base
   *  
   **/
  function reverse($super) {
    if (this.currentTime != null) 
      computeRunningFxForTime(this, this.currentTime);
      
    return $super();
  }
  
  /** 
   *  FX.Score#rewind() -> FX.Base
   *  
   **/
  function rewind(doNotFireEvent) {
    // Stop before rewinding
    this.stop();
    
    // Simulate playing the group backward
    this.backward = !this.backward;
    computeRunningFxForTime(this, this.currentTime);

    while (this.runningFx.length > 0) {
      this.runningFx.each(function(fxInfo) {
        fxInfo.fx.rewind();
      });
      computeRunningFxForTime(this, this.nextTime + (this.backward ? -0.000001 : 0.000001));
    }
    
    // Restore backward ad current time
    this.backward = !this.backward;
    this.currentTime = this.backward ? this.duration : 0;
    
    if (!doNotFireEvent) this.fire('rewinded');
    return this;
  }
  
  /** 
   *  FX.Score#add(fx [, options]) -> FX.Base
   *  
   **/
  function add(fx, options) {
    if (options) {
      var after    = options.after;
      var position = options.position;
      var delay    = options.delay || 0;
      if (after && position)
        throw "Error: Score#add options after and position cannot be set at the same time";

      if (after) {
        var afterFx = after.fx || after;
        var fxInfo = this.effects.find(function(item) {return item.fx == afterFx});
        this.effects.push({fx: fx, start: fxInfo.end + delay, end: fxInfo.end + fx.options.duration + delay});
        this.duration = Math.max(this.duration, fxInfo.end + fx.options.duration + delay);    
      }
      
      if (position == 'last') {
        this.effects.push({fx: fx, start: this.duration + delay, end: this.duration + fx.options.duration + delay})
        this.duration += fx.options.duration + delay;
      }
    }
    else {
      this.effects.push({fx: fx, start: 0, end: fx.options.duration})
      this.duration = Math.max(this.duration, fx.options.duration);
    }
    return this;
  }

  // TODO: May be should use FX.Base#metronomeUpdate
  function metronomeUpdate(delta) {
    // Update current time
    if ((this.backward && this.currentTime <= this.nextTime) || (!this.backward && this.currentTime >= this.nextTime))
      computeRunningFxForTime(this, this.currentTime);
    this.currentTime += this.backward ? -delta : delta;
    
    // Update running effects
    this.runningFx.each(function(fxInfo) {
      var fx  = fxInfo.fx;
      var pos = fx.options.transition((this.currentTime - fxInfo.start) / fx.getDuration(), this.currentTime - fxInfo.start, 0, 1, fx.getDuration());
      fxInfo.fx.updateAnimation(pos);
     }, this);
    
    // Unregister from FX.Metronome if time is out of range
    if (this.currentTime > this.duration || this.currentTime <0) {
      FX.Metronome.unregister(this);
      this.currentTime = null;
      this.playing   = false;
    }
  }
  
  // Private function
  function computeRunningFxForTime(score, time){
    // Stop effects that does not need to run anymore
    var keepRunningFx = new Array();
    score.runningFx.each(function(fxInfo) {
      // Stop fx if fx is not in its running time range
      if (time < fxInfo.start || time > fxInfo.end) {
        fxInfo.fx.updateAnimation(score.backward ? 0 : 1);
        fxInfo.fx.stopAnimation();
      }
      else
        keepRunningFx.push(fxInfo);
    }, this);
    
    score.runningFx.clear();
    score.nextTime = score.backward ? 0 : score.duration;
    
    // Find effects to
    score.effects.each(function(fxInfo) {
      if (notYetPlayed(fxInfo, time, score.backward)) {
        var addIt = isPlaying(fxInfo, time);
        if (addIt) {
          score.runningFx.push(fxInfo);
          // New effect to start, call startAnimation on it
          if (!keepRunningFx.include(fxInfo))
            fxInfo.fx.startAnimation(score.backward);
        }

        // Compute next time when computeRunningFxForTime should be called
        if (score.backward)
          score.nextTime = Math.max(score.nextTime, addIt ? fxInfo.start : fxInfo.end);
        else
          score.nextTime = Math.min(score.nextTime, addIt ? fxInfo.end : fxInfo.start);
      }
    }, score); 
  }
  
  function alreadyPlayed(fxInfo, time, backward) {
    return (backward && time < fxInfo.start) || (!backward && time > fxInfo.end)
  }
  
  function notYetPlayed(fxInfo, time, backward) {
    return !alreadyPlayed(fxInfo, time, backward);
  }

  function isPlaying(fxInfo, time) {
    return (fxInfo.start <= time && time <= fxInfo.end);
  }
  
  return {
    initialize:      initialize,
    getDuration:     getDuration,
    play:            play,
    reverse:         reverse,
    rewind:          rewind,
    add:             add,
    metronomeUpdate: metronomeUpdate
  }
})());
