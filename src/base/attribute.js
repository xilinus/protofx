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
