// Generated by CoffeeScript 1.6.3
var Scale;

Scale = (function() {
  function Scale(obj) {
    if (obj == null) {
      obj = {};
    }
    this.size = obj.size || 200;
    this.range = obj.range || [0, 100];
    if (typeof this.size === "object" && this.size.length) {
      this.size = this.size[1];
    }
  }

  Scale.prototype.linear = function(num) {
    var normalised_delta, normalised_num, percentage, the;
    the = this;
    normalised_delta = the.range[1];
    if (the.range[0] < 0) {
      normalised_delta += Math.abs(the.range[0]);
      num += Math.abs(the.range[0]);
    } else if (the.range[0] > 0) {
      normalised_delta = the.range[1] - the.range[0];
    }
    normalised_num = num - the.range[0];
    percentage = normalised_num / normalised_delta;
    return percentage * the.size;
  };

  return Scale;

})();
