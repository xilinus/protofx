/**
 *  == fx ==
 *  The FX section
**/

/** section: fx
 * FX
 **/
 
// Namespace
FX = {};

// t: current time, b: beginning value, c: change in value, d: duration
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
    this.cycle       = false;
    this.callbacks   = {onEnded: Prototype.emptyFunction, onStarted: Prototype.emptyFunction};
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
   *  FX.Base#setCycle(type, count) -> FX.Base
   *  - type (String): 
   *    - 'loop' restarts from begin when effect is done
   *    - 'backAndForth' starts in reverse mode when effect is done
   *    - 'none' no cycles
   *  - count (Number or "unlimited"): number of cycles to run (default 1)
   **/
  function setCycle(type, count) {
    this.cycle = type == 'none' ? false : {type: type, count: count || 1, current: 0}
    return this;
  }
  
  /** 
   *  FX.Base#play() -> FX.Base
   *  
   *  Starts animation from current position
   *  fires fx:started, fx:beforeStarted
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
    if (this.cycle) this.cycle.current = 1;
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
      // Check cycle
      if (this.cycle && (this.cycle.current < this.cycle.count || this.cycle.count == 'unlimited')) {
        if (this.cycle.type == 'loop') {
          this.cycle.current++;
          this.updateAnimation(this.backward ? 1 : 0);
          this.currentTime = this.backward ? this.getDuration() : 0;
        }
        else if (this.cycle.type == 'backAndForth') {
          this.reverse();
          if (this.backward) this.cycle.current++;
        }
      }
      else {
        this.stopAnimation();
        this.fire('ended');

        FX.Metronome.unregister(this);
      
        this.currentTime = null;
        this.playing   = false;
        if (this.cycle) {
          this.cycle.current = 0;
          if (this.cycle.type == 'backAndForth') this.backward = !this.backward;
        }
      }
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
    setCycle:        setCycle,
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
