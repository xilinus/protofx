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
