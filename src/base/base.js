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


FX.DefaultOptions = {duration: 500, transition: FX.Transition.swing, eventNotifier: document};
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
    this.options     = Object.clone(FX.DefaultOptions);
    this.currentTime = null;
    this.nextTime    = 0;
    this.isPlaying   = false;
    this.backward    = false;

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
   *  FX.Base#play() -> FX.Base
   *  
   *  Starts animation from current position
   *  fires fx:started
   **/
  function play() {
    if (this.isPlaying) return;
      
    this.isPlaying = true;

    // Reset time for a new play
    if (this.currentTime == null) {
      this.currentTime = this.backward ? this.getDuration() : 0;
      this.startAnimation(this.backward);
    }

    // Add it to metronome to receive recurring updateAnimation
    FX.Metronome.register(this);

    this.options.eventNotifier.fire('fx:started', {fx: this});
    return this;
  }
  
  /** 
   *  FX.Base#stop() -> FX.Base
   *  
   *  Stops animation at current running position
   *  fires fx:started
   **/
  function stop() {
    this.options.eventNotifier.fire('fx:stopped', {fx: this});
    FX.Metronome.unregister(this);
    this.isPlaying = false;
    return this;
  }
  
  /** 
   *  FX.Base#reverse() -> FX.Base
   *  
   *  Reverses animation. If animation is running, it keeps running backward
   *  fire fx:reversed
   **/
  function reverse() {
    this.options.eventNotifier.fire('fx:reversed', {fx: this});
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
    this.options.eventNotifier.fire('fx:rewinded', {fx: this});
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

      FX.Metronome.unregister(this);
      
      this.currentTime = null;
      this.isPlaying   = false;
    }
    else {
      var pos = this.options.transition(this.currentTime / this.getDuration(), this.currentTime, 0, 1, this.getDuration());
      this.updateAnimation(pos);
    }
  }

  // Internal callbacks for subclasses
  function startAnimation(backward) {
  }
  
  function stopAnimation() {
  }
  
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
    metronomeUpdate: metronomeUpdate,
    startAnimation:  startAnimation,
    stopAnimation:   stopAnimation,
    updateAnimation: updateAnimation
  }
})());
