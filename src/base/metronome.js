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

