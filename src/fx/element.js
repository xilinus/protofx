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
    this.element     = $(element);
  }
  
  function animate(attributes) {
    this.originalAttributes = attributes;    
    return this;
  }
  
  function cloneFor(element) {
    return new FX.Element(element, this.options).animate(this.originalAttributes);
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

