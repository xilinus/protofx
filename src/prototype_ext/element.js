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