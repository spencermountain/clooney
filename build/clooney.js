/*! clooney 
 by @spencermountain
 2014-06-07 */
// a loving concatenation of d3's treemap layout file, and it's dependencies
// https://github.com/mbostock/d3/blob/master/src/layout/treemap.js

d3 = {}
d3.layout = {};

d3.merge = function(arrays) {
  var n = arrays.length,
    m,
    i = -1,
    j = 0,
    merged,
    array;

  while (++i < n) j += arrays[i].length;
  merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1,
    n = arguments.length,
    method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}

d3.layout.hierarchy = function() {
  var sort = d3_layout_hierarchySort,
    children = d3_layout_hierarchyChildren,
    value = d3_layout_hierarchyValue;

  // Recursively compute the node depth and value.
  // Also converts to a standard hierarchy structure.
  function recurse(node, depth, nodes) {
    var childs = children.call(hierarchy, node, depth);
    node.depth = depth;
    nodes.push(node);
    if (childs && (n = childs.length)) {
      var i = -1,
        n,
        c = node.children = new Array(n),
        v = 0,
        j = depth + 1,
        d;
      while (++i < n) {
        d = c[i] = recurse(childs[i], j, nodes);
        d.parent = node;
        v += d.value;
      }
      if (sort) c.sort(sort);
      if (value) node.value = v;
    } else {
      delete node.children;
      if (value) {
        node.value = +value.call(hierarchy, node, depth) || 0;
      }
    }
    return node;
  }

  // Recursively re-evaluates the node value.
  function revalue(node, depth) {
    var children = node.children,
      v = 0;
    if (children && (n = children.length)) {
      var i = -1,
        n,
        j = depth + 1;
      while (++i < n) v += revalue(children[i], j);
    } else if (value) {
      v = +value.call(hierarchy, node, depth) || 0;
    }
    if (value) node.value = v;
    return v;
  }

  function hierarchy(d) {
    var nodes = [];
    recurse(d, 0, nodes);
    return nodes;
  }

  hierarchy.sort = function(x) {
    if (!arguments.length) return sort;
    sort = x;
    return hierarchy;
  };

  hierarchy.children = function(x) {
    if (!arguments.length) return children;
    children = x;
    return hierarchy;
  };

  hierarchy.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return hierarchy;
  };

  // Re-evaluates the `value` property for the specified hierarchy.
  hierarchy.revalue = function(root) {
    revalue(root, 0);
    return root;
  };

  return hierarchy;
};

// A method assignment helper for hierarchy subclasses.
function d3_layout_hierarchyRebind(object, hierarchy) {
  d3.rebind(object, hierarchy, "sort", "children", "value");

  // Add an alias for nodes and links, for convenience.
  object.nodes = object;
  object.links = d3_layout_hierarchyLinks;

  return object;
}

function d3_layout_hierarchyChildren(d) {
  return d.children;
}

function d3_layout_hierarchyValue(d) {
  return d.value;
}

function d3_layout_hierarchySort(a, b) {
  return b.value - a.value;
}

// Returns an array source+target objects for the specified nodes.
function d3_layout_hierarchyLinks(nodes) {
  return d3.merge(nodes.map(function(parent) {
    return (parent.children || []).map(function(child) {
      return {
        source: parent,
        target: child
      };
    });
  }));
}


// Squarified Treemaps by Mark Bruls, Kees Huizing, and Jarke J. van Wijk
// Modified to support a target aspect ratio by Jeff Heer
d3.layout.treemap = function() {
  var hierarchy = d3.layout.hierarchy(),
    round = Math.round,
    size = [1, 1], // width, height
    padding = null,
    pad = d3_layout_treemapPadNull,
    sticky = false,
    stickies,
    mode = "squarify",
    ratio = 0.5 * (1 + Math.sqrt(5)); // golden ratio

  // Compute the area for each child based on value & scale.
  function scale(children, k) {
    var i = -1,
      n = children.length,
      child,
      area;
    while (++i < n) {
      area = (child = children[i]).value * (k < 0 ? 0 : k);
      child.area = isNaN(area) || area <= 0 ? 0 : area;
    }
  }

  // Recursively arranges the specified node's children into squarified rows.
  function squarify(node) {
    var children = node.children;
    if (children && children.length) {
      var rect = pad(node),
        row = [],
        remaining = children.slice(), // copy-on-write
        child,
        best = Infinity, // the best row score so far
        score, // the current row score
        u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), // initial orientation
        n;
      scale(remaining, rect.dx * rect.dy / node.value);
      row.area = 0;
      while ((n = remaining.length) > 0) {
        row.push(child = remaining[n - 1]);
        row.area += child.area;
        if (mode !== "squarify" || (score = worst(row, u)) <= best) { // continue with this orientation
          remaining.pop();
          best = score;
        } else { // abort, and try a different orientation
          row.area -= row.pop().area;
          position(row, u, rect, false);
          u = Math.min(rect.dx, rect.dy);
          row.length = row.area = 0;
          best = Infinity;
        }
      }
      if (row.length) {
        position(row, u, rect, true);
        row.length = row.area = 0;
      }
      children.forEach(squarify);
    }
  }

  // Recursively resizes the specified node's children into existing rows.
  // Preserves the existing layout!
  function stickify(node) {
    var children = node.children;
    if (children && children.length) {
      var rect = pad(node),
        remaining = children.slice(), // copy-on-write
        child,
        row = [];
      scale(remaining, rect.dx * rect.dy / node.value);
      row.area = 0;
      while (child = remaining.pop()) {
        row.push(child);
        row.area += child.area;
        if (child.z != null) {
          position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
          row.length = row.area = 0;
        }
      }
      children.forEach(stickify);
    }
  }

  // Computes the score for the specified row, as the worst aspect ratio.
  function worst(row, u) {
    var s = row.area,
      r,
      rmax = 0,
      rmin = Infinity,
      i = -1,
      n = row.length;
    while (++i < n) {
      if (!(r = row[i].area)) continue;
      if (r < rmin) rmin = r;
      if (r > rmax) rmax = r;
    }
    s *= s;
    u *= u;
    return s ? Math.max((u * rmax * ratio) / s, s / (u * rmin * ratio)) : Infinity;
  }

  // Positions the specified row of nodes. Modifies `rect`.
  function position(row, u, rect, flush) {
    var i = -1,
      n = row.length,
      x = rect.x,
      y = rect.y,
      v = u ? round(row.area / u) : 0,
      o;
    if (u == rect.dx) { // horizontal subdivision
      if (flush || v > rect.dy) v = rect.dy; // over+underflow
      while (++i < n) {
        o = row[i];
        o.x = x;
        o.y = y;
        o.dy = v;
        x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
      }
      o.z = true;
      o.dx += rect.x + rect.dx - x; // rounding error
      rect.y += v;
      rect.dy -= v;
    } else { // vertical subdivision
      if (flush || v > rect.dx) v = rect.dx; // over+underflow
      while (++i < n) {
        o = row[i];
        o.x = x;
        o.y = y;
        o.dx = v;
        y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
      }
      o.z = false;
      o.dy += rect.y + rect.dy - y; // rounding error
      rect.x += v;
      rect.dx -= v;
    }
  }

  function treemap(d) {
    var nodes = stickies || hierarchy(d),
      root = nodes[0];
    root.x = 0;
    root.y = 0;
    root.dx = size[0];
    root.dy = size[1];
    if (stickies) hierarchy.revalue(root);
    scale([root], root.dx * root.dy / root.value);
    (stickies ? stickify : squarify)(root);
    if (sticky) stickies = nodes;
    return nodes;
  }

  treemap.size = function(x) {
    if (!arguments.length) return size;
    size = x;
    return treemap;
  };

  treemap.padding = function(x) {
    if (!arguments.length) return padding;

    function padFunction(node) {
      var p = x.call(treemap, node, node.depth);
      return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [p, p, p, p] : p);
    }

    function padConstant(node) {
      return d3_layout_treemapPad(node, x);
    }

    var type;
    pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [x, x, x, x], padConstant) : padConstant;
    return treemap;
  };

  treemap.round = function(x) {
    if (!arguments.length) return round != Number;
    round = x ? Math.round : Number;
    return treemap;
  };

  treemap.sticky = function(x) {
    if (!arguments.length) return sticky;
    sticky = x;
    stickies = null;
    return treemap;
  };

  treemap.ratio = function(x) {
    if (!arguments.length) return ratio;
    ratio = x;
    return treemap;
  };

  treemap.mode = function(x) {
    if (!arguments.length) return mode;
    mode = x + "";
    return treemap;
  };

  return d3_layout_hierarchyRebind(treemap, hierarchy);
};

function d3_layout_treemapPadNull(node) {
  return {
    x: node.x,
    y: node.y,
    dx: node.dx,
    dy: node.dy
  };
}

function d3_layout_treemapPad(node, padding) {
  var x = node.x + padding[3],
    y = node.y + padding[0],
    dx = node.dx - padding[1] - padding[3],
    dy = node.dy - padding[0] - padding[2];
  if (dx < 0) {
    x += dx / 2;
    dx = 0;
  }
  if (dy < 0) {
    y += dy / 2;
    dy = 0;
  }
  return {
    x: x,
    y: y,
    dx: dx,
    dy: dy
  };
}
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

// Generated by CoffeeScript 1.6.3
define(function(require, exports, module) {
  var Bar, ContainerSurface, Easing, Engine, EventHandler, Graph, ImageSurface, Modifier, RenderController, RenderNode, Scrollview, SequentialLayout, SpringTransition, Surface, Timer, Transform, Transitionable, View, WallTransition, sort_transition, spring_transition, wall_transition;
  Engine = require("famous/core/Engine");
  Transform = require("famous/core/Transform");
  Modifier = require("famous/core/Modifier");
  Surface = require("famous/core/Surface");
  ContainerSurface = require("famous/surfaces/ContainerSurface");
  Transitionable = require("famous/transitions/Transitionable");
  ImageSurface = require("famous/surfaces/ImageSurface");
  Easing = require("famous/transitions/Easing");
  Scrollview = require("famous/views/Scrollview");
  Timer = require("famous/utilities/Timer");
  RenderNode = require("famous/core/RenderNode");
  EventHandler = require('famous/core/EventHandler');
  RenderController = require("famous/views/RenderController");
  SequentialLayout = require("famous/views/SequentialLayout");
  View = require('famous/core/View');
  SpringTransition = require('famous/transitions/SpringTransition');
  WallTransition = require('famous/transitions/WallTransition');
  Transitionable.registerMethod('spring', SpringTransition);
  Transitionable.registerMethod('wall', WallTransition);
  window.mainContext = Engine.createContext();
  window.eventHandler = new EventHandler();
  wall_transition = {
    method: 'wall',
    period: 450,
    dampingRatio: 0.7
  };
  spring_transition = {
    method: 'spring',
    period: 450,
    dampingRatio: 0.7
  };
  sort_transition = {
    method: 'wall',
    period: 750,
    dampingRatio: 0.8
  };
  Bar = (function() {
    function Bar(options) {
      var label, the;
      if (options == null) {
        options = {};
      }
      the = this;
      this.d = options.d || {
        value: 0,
        label: ""
      };
      this.i = options.i;
      this.graph = options.graph;
      this.killed = false;
      this.s = new Surface({
        size: [void 0, void 0],
        content: this.d.label || this.d.value,
        properties: {
          backgroundColor: this.d.color || "steelblue",
          overflow: "hidden",
          textAlign: "right",
          color: "white",
          "font-size": "10px"
        }
      });
      this.compute();
      this.s.on('mouseenter', function() {
        if (the.graph.show_label) {
          the.show_label();
        }
        return the.focus();
      });
      this.s.on('mouseout', function() {
        if (the.graph.show_label) {
          the.hide_label();
        }
        return the.unfocus();
      });
      this.s.on('click', function() {
        if (the.killed) {
          return the.unkill_others();
        } else {
          return the.kill_others();
        }
      });
      this.mod = new Modifier({
        origin: this.origin,
        transform: Transform.translate(this.x, this.y),
        size: [0.1, 0.1],
        opacity: 0.8
      });
      this.mod.setSize([this.w, this.h], wall_transition);
      this.graph.node.add(this.mod).add(this.s);
      this.label_mod = new Modifier({
        origin: this.origin,
        transform: Transform.translate(this.x, this.y),
        size: [0.1, 0.1]
      });
      label = new Surface({
        content: this.d.label || '',
        properties: {
          color: "#5c6056",
          "z-index": "4",
          overflow: "hidden"
        }
      });
      this.graph.node.add(this.label_mod).add(label);
    }

    Bar.prototype.compute = function() {
      var already, the, _i, _ref, _results;
      the = this;
      if (this.graph.type === "vertical_bar") {
        this.y = 0;
        this.h = this.graph.y_scale.linear(the.d.value);
        this.x = this.graph.x_scale.linear(the.i);
        this.w = this.graph.x_scale.linear(1) - 1;
        the.s.setProperties({
          "font-size": "11px",
          "text-align": "left"
        });
        this.origin = [0, 1];
        if (this.graph.align === "middle") {
          this.origin = [0, 0.5];
        }
        if (this.graph.align === "end") {
          this.origin = [0, 0];
        }
        if (this.graph.hidden) {
          return this.h = 0.1;
        }
      } else if (this.graph.type === "horizontal_bar") {
        this.x = 0;
        this.y = -this.graph.y_scale.linear(the.i);
        this.h = this.graph.y_scale.linear(1) - 1;
        this.w = this.graph.x_scale.linear(the.d.value);
        the.s.setProperties({
          "font-size": "11px",
          "text-align": "left"
        });
        this.origin = [0, 1];
        if (this.graph.align === "middle") {
          this.origin = [0.5, 1];
        }
        if (this.graph.align === "end") {
          this.origin = [1, 1];
        }
        if (this.graph.hidden) {
          return this.w = 0.1;
        }
      } else if (this.graph.type === "area_bar") {
        if (the.i === 0) {
          already = 0;
        } else {
          already = (function() {
            _results = [];
            for (var _i = 0, _ref = the.i - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
            return _results;
          }).apply(this).reduce(function(h, i) {
            return h + the.graph.data[i].value;
          }, 0);
        }
        this.x = this.graph.x_scale.linear(already);
        this.w = this.graph.x_scale.linear(the.d.value);
        this.y = 0;
        this.h = 50;
        this.origin = [0, 1];
        the.s.setProperties({
          "font-size": "11px",
          "text-align": "left"
        });
        if (this.graph.align === "middle") {
          this.origin = [0, 0.5];
        }
        if (this.graph.align === "end") {
          this.origin = [0, 0];
        }
        if (this.graph.hidden) {
          return this.h = 0.1;
        }
      } else if (this.graph.type === "treemap") {
        this.x = the.d.x;
        this.y = the.d.y;
        this.h = the.d.dy;
        this.w = the.d.dx;
        the.s.setProperties({
          "font-size": "20px",
          "text-align": "center"
        });
        this.origin = [0, 0];
        if (this.graph.hidden) {
          return this.h = 0.1;
        }
      }
    };

    Bar.prototype.draw = function(transition, cb) {
      var the;
      if (transition == null) {
        transition = wall_transition;
      }
      if (cb == null) {
        cb = function() {};
      }
      the = this;
      the.mod.setOrigin(the.origin, transition);
      the.mod.setTransform(Transform.translate(the.x, the.y), transition);
      the.mod.setSize([the.w, the.h], transition, cb);
      return the.draw_label();
    };

    Bar.prototype.draw_label = function() {
      var the, x, y;
      the = this;
      if (this.graph.type === "vertical_bar") {
        x = this.x;
        y = -this.h;
        if (!this.graph.bars[this.i + 1]) {
          x -= 50;
        }
        if (this.origin[1] !== 1) {
          y = -this.graph.height / 1.5;
        }
      }
      if (this.graph.type === "horizontal_bar") {
        x = this.w;
        y = this.y;
        if (this.origin[0] !== 0) {
          x = this.graph.width / 2;
        }
        if (x + 100 > the.graph.width) {
          x = the.graph.width - 120;
        }
      }
      if (this.graph.type === "area_bar") {
        x = this.x;
        y = this.y - 60;
        if (this.origin[1] === 0) {
          y = -this.graph.width / 2;
        }
        if (this.origin[1] === 0.5) {
          y = -(this.graph.width / 2) + 30;
        }
        if (!this.graph.bars[this.i + 1]) {
          x -= 50;
        }
      }
      if (this.graph.type === "treemap") {
        x = this.d.dx;
        y = this.d.dy;
      }
      return this.label_mod.setTransform(Transform.translate(x, y), wall_transition);
    };

    Bar.prototype.hide_label = function() {
      if (!this.killed) {
        return this.label_mod.setSize([0.1, 0.1]);
      }
    };

    Bar.prototype.show_label = function() {
      if (!this.killed) {
        return this.label_mod.setSize([100, 20]);
      }
    };

    Bar.prototype.focus = function() {
      var x, y;
      if (!this.killed) {
        if (this.graph.type === "vertical_bar" || this.graph.type === "area_bar") {
          x = this.w;
          y = this.h + 3;
        }
        if (this.graph.type === "horizontal_bar") {
          x = this.w + 3;
          y = this.h;
        }
        if (this.graph.type === "treemap") {
          x = this.d.dx;
          y = this.d.dy;
          this.mod.setOpacity(1.0);
        }
        return this.mod.setSize([x, y], {
          duration: 100
        });
      }
    };

    Bar.prototype.unfocus = function() {
      if (!this.killed) {
        this.mod.setSize([this.w, this.h], {
          duration: 100
        });
      }
      return this.mod.setOpacity(0.8);
    };

    Bar.prototype.kill = function() {
      var the;
      the = this;
      the.killed = true;
      if (this.graph.type === "vertical_bar" || this.graph.type === "area_bar") {
        the.mod.setSize([the.w, the.h * 0.1], wall_transition);
      }
      if (this.graph.type === "horizontal_bar") {
        the.mod.setSize([the.w * 0.1, the.h], wall_transition);
      }
      if (this.graph.type === "treemap") {
        return the.mod.setSize([the.w * 0.2, the.h * 0.2], wall_transition);
      }
    };

    Bar.prototype.unkill = function() {
      var the;
      the = this;
      the.killed = false;
      the.draw();
      return Timer.after(function() {
        return the.hide_label();
      }, 5);
    };

    Bar.prototype.kill_others = function() {
      var the;
      the = this;
      return the.graph.bars.forEach(function(b, i) {
        b.killed = true;
        if (b.i !== the.i) {
          return b.kill();
        }
      });
    };

    Bar.prototype.unkill_others = function() {
      var the;
      the = this;
      return the.graph.bars.forEach(function(b, i) {
        return b.unkill();
      });
    };

    Bar.prototype.sort_to = function(i, transition, cb) {
      if (transition == null) {
        transition = sort_transition;
      }
      if (cb == null) {
        cb = function() {};
      }
      this.i = i;
      this.compute();
      return this.draw(transition, cb);
    };

    return Bar;

  })();
  Graph = (function() {
    var the;

    the = Graph;

    function Graph(options) {
      if (options == null) {
        options = {};
      }
      this.data = options.data || [];
      this.width = options.width || 400;
      this.height = options.height || 400;
      this.bars = [];
      this.align = options.align || "start";
      this.type = options.type || "vertical_bar";
      this.show_labels = options.show_labels || true;
      this.hidden = options.hidden !== null && options.hidden === true;
      this.label_size = 50;
      this.node = new ContainerSurface({
        size: [this.width, this.height],
        properties: {
          overflow: "hidden",
          border: "1px solid steelblue",
          "border-radius": "2px"
        }
      });
      this.compute();
      this.bars = this.data.map(function(d, i) {
        return new Bar({
          graph: the,
          d: d,
          i: i
        });
      });
      this.draw();
    }

    Graph.prototype.update = function(options) {
      if (options == null) {
        options = {};
      }
      options.transition = options.transition || wall_transition;
      if (options.width || options.height) {
        if (options.width !== void 0) {
          this.width = options.width;
        }
        if (options.height !== void 0) {
          this.height = options.height;
        }
        this.node.setSize([this.width, this.height]);
      }
      if (options.hidden === null) {
        options.hidden = false;
      }
      this.data = options.data || this.data;
      this.width = options.width || this.width;
      this.height = options.height || this.height;
      this.align = options.align || this.align;
      this.type = options.type || this.type;
      this.hidden = options.hidden;
      this.compute();
      return this.draw(options.transition);
    };

    Graph.prototype.compute = function() {
      var arr, max, obj, sum, treemap, values;
      the = this;
      values = the.data.map(function(d) {
        return d.value;
      });
      max = Math.max.apply(Math, values);
      if (the.type === "vertical_bar") {
        the.x_scale = new Scale({
          size: [0, the.width],
          range: [0, the.data.length]
        });
        the.y_scale = new Scale({
          size: [0, the.height - this.label_size],
          range: [0, max]
        });
      } else if (the.type === "horizontal_bar") {
        the.x_scale = new Scale({
          size: [0, the.width - this.label_size],
          range: [0, max]
        });
        the.y_scale = new Scale({
          size: [0, the.height],
          range: [0, the.data.length]
        });
      } else if (the.type === "area_bar") {
        sum = the.data.reduce(function(h, s) {
          return h + s.value;
        }, 0);
        the.x_scale = new Scale({
          size: [0, the.width],
          range: [0, sum]
        });
        the.y_scale = new Scale({
          size: [0, the.height - this.label_size],
          range: [0, 100]
        });
      } else if (the.type === "treemap") {
        treemap = d3.layout.treemap().size([the.width, the.height]).sticky(true).value(function(d) {
          return d.value;
        });
        obj = {
          children: the.data
        };
        arr = treemap(obj);
        arr = arr.slice(1, arr.length);
        the.data = arr;
        the.x_scale = {};
        the.y_scale = {};
      }
      return this.bars.forEach(function(bar, i) {
        bar.d = the.data[i];
        return bar.compute(i);
      });
    };

    Graph.prototype.build = function() {
      return this.node;
    };

    Graph.prototype.draw = function() {
      return this.bars.forEach(function(bar, i) {
        return Timer.after(function() {
          return bar.draw();
        }, i);
      });
    };

    Graph.prototype.append = function(obj) {
      var b;
      if (obj == null) {
        obj = {};
      }
      the = this;
      obj.value = obj.value || 0;
      obj.color = obj.color || "rgba(42,111,180,0.7)";
      the.data.push(obj);
      this.compute();
      b = new Bar({
        graph: g,
        i: the.bars.length,
        d: obj
      });
      this.bars.push(b);
      this.update();
      return this.update();
    };

    Graph.prototype.show = function() {
      return this.update({
        hidden: false
      });
    };

    Graph.prototype.hide = function() {
      return this.update({
        hidden: true
      });
    };

    Graph.prototype.resize = function(obj) {
      if (obj == null) {
        obj = {};
      }
      return this.update(obj);
    };

    Graph.prototype.align = function(l) {
      if (l == null) {
        l = "start";
      }
      if (l === "left") {
        l = "start";
      }
      if (l === "right") {
        l = "end";
      }
      if (l === "center") {
        l = "middle";
      }
      if (l === "top") {
        l = "end";
      }
      if (l === "bottom") {
        l = "start";
      }
      return this.update({
        align: true
      });
    };

    Graph.prototype.update_order = function() {
      return this.bars.forEach(function(b, l) {
        Timer.after(function() {
          return b.sort_to(l);
        }, l * 1.5);
        return data[l] = b.d;
      });
    };

    Graph.prototype.sort = function(fn) {
      if (!fn || typeof fn === "string") {
        fn = function(a, b) {
          if (b.d.value > a.d.value) {
            return 1;
          }
          if (b.d.value === a.d.value) {
            return 0;
          }
          return -1;
        };
      }
      this.bars = this.bars.sort(fn);
      if (fn === "desc") {
        this.bars = this.bars.reverse();
      }
      if (this.type === "area_bar" || this.type === "treemap") {
        this.compute();
      }
      return this.update_order();
    };

    Graph.prototype.randomize = function() {
      return this.sort(function() {
        return Math.round(Math.random());
      });
    };

    Graph.prototype.random_walk = function() {
      the = this;
      return this.bars.forEach(function(bar, l) {
        var duration, spot, transition;
        duration = Math.random() * 2500 + 1000;
        transition = {
          duration: duration
        };
        spot = Math.random() * the.bars.length;
        return bar.sort_to(spot, transition, function() {
          return bar.sort_to(l, transition);
        });
      });
    };

    Graph.prototype.wave = function(amount) {
      var transition;
      if (amount == null) {
        amount = 1.2;
      }
      the = this;
      transition = {
        duration: 200
      };
      return this.bars.forEach(function(bar, l) {
        return Timer.after(function() {
          if (the.type === "vertical_bar" || the.type === "area_bar") {
            return bar.mod.setSize([bar.w, bar.h * amount], transition, function() {
              return bar.mod.setSize([bar.w, bar.h], transition);
            });
          } else if (the.type === "treemap") {
            return bar.mod.setSize([bar.w * amount, bar.h * amount], transition, function() {
              return bar.mod.setSize([bar.w, bar.h], transition);
            });
          } else {
            return bar.mod.setSize([bar.w * amount, bar.h], transition, function() {
              return bar.mod.setSize([bar.w, bar.h], transition);
            });
          }
        }, l * 1.4);
      });
    };

    return Graph;

  })();
  window.Bar = Bar;
  return module.exports = Graph;
});
