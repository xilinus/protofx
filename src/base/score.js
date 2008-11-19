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
    this.runningFx = new Array();
    this.effects   =  new Array();
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
    if (this.isPlaying)
      return;
      
    // Reset time for a new play
    if (this.currentTime == null)  {
      this.rewind();
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
  function rewind() {
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
        throw "Error";

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
      this.isPlaying   = false;
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
