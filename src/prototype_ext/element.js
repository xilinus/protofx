Element.addMethods({
  fade: function(element, options) {
    if (!(element = $(element))) return;
    new FX.Element(element)
      .setOptions(options || {})
      .animate({opacity: 0})
      .play();
    return element;
  },
  
  appear: function(element, options) {
    if (!(element = $(element))) return;
    new FX.Element(element)
      .setOptions(options || {})
      .animate({opacity: 1})
      .play();
    return element;
  },
  
  blindUp: function(element, options) {
    if (!(element = $(element)) || !element.visible() || element.fx) return;
    
    element.fx = new FX.Element(element)
      .setOptions(options || {})
      .onBeforeStarted(function() {element.originalHeight = element.style.height})
      .onEnded(function() {element.hide(); element.style.height = element.originalHeight; delete element.fx})
      .animate({height: 0})
      .play();
    return element;
  },
  
  blindDown: function(element, options) {
    if (!(element = $(element)) || element.visible() || element.fx) return;
    var height = element.getHeight();

    element.fx = new FX.Element(element)
      .setOptions(options || {})
      .onBeforeStarted(function() {element.show(); element.style.height = '0px'})
      .onEnded(function() {delete element.fx})
      .animate({height: height + 'px'})
      .play();
    return element;
  },
  
  highlight: function(element, options) {
    if (!(element = $(element)) || !element.visible()) return;
    options = options || {};

    if (element.fx) element.fx.stop().reverse().rewind();

    var highlightColor = options.highlightColor || "#ffff99";
    var originalColor = element.getStyle('background-color');
        
    element.fx = new FX.Element(element.setStyle({backgroundColor: highlightColor}))
      .setOptions(options)
      .animate({backgroundColor: originalColor})
      .onEnded(function() {delete element.fx})
      .play();
    return element;
  }
});