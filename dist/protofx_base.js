
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
    this.callbacks   = {onEnded: Prototype.emptyFunction}
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
    onEnded:         onEnded
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

