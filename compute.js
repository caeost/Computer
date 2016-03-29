// ideas: 
// 1) add robust set (of compilable away) of debugging tools to see ex: size of trees, timing, cyclical re calls
// 2) ID constantly counts up, can potentially be used to know if a value could reference another

var log = console.log;

function extend(target, props) {
  for(var key in props) {
    target[key] = props[key];
  }
  return target;
}

var Context = null;
var ID = 0;
var cloud = {};
var running = false;

var objPop = function(obj) {
  var keys = Object.keys(obj);
  if(!keys.length) return false;
  return Math.max.apply(Math, keys);
}

var inner = function Computer(value) {
  if(arguments.length) {
    log(`${this.id} set ${JSON.stringify(value)}`);
    var old = this.value;
    this.value = value;
    if(!this.isEqual(value, old)) {
      log(`${this.id} changed from ${old} => ${value} checking dependencies: ${JSON.stringify(Object.keys(this.dependencies))}`);
      extend(cloud, this.dependencies);
      if(!running) {
        running = true;
        var val;
        while((key = objPop(cloud)) !== false) {
          log(`${cloud[key].id} running compute`);
          cloud[key].inner.compute();
        }
        running = false;
      }
    }
  } else {
    if(cloud[this.id]) {
      this.inner.compute();
    }
    if(Context) {
      log(`${this.id} getting new dependency: ${Context.id}`);
      this.dependencies[Context.id] = Context;
    }
  }

  return this.value;
};

// todo make this extendable 
var Compute = function Compute(func) {
  if(!(this instanceof Compute)) {
    return new Compute(func);
  }

  var context = Object.create(this);
  context.id = ID++;
  context.dependencies = {};

  var local = context.inner = inner.bind(context);
  local.context = context;

  if(typeof func === "function") {
    log(`Creating listening computer with ID: ${context.id} and function: \n${func.toString()}`);
    local.compute = function() {
      var prev = Context;
      Context = this; // this is 'context'
      delete cloud[this.id];
      this.inner(func());
      Context = prev;
    }.bind(context);

    local.compute();
  } else {
    log(`Creating basic computer with ID: ${context.id} and value: ${func}`);
    local(func);
  }

  return local;
};

Compute.prototype = {
  toJSON: function toJSON() {
    return this.get();
  },
  isEqual: function(a,b) {
    return a === b;
  }
};

// taken from backbone.js
Compute.extend = function(protoProps, staticProps) {
  var parent = this;
  var child = function(func){ 
    if(!(this instanceof child)) {
      return new child(func);
    } else {
      return parent.apply(this, arguments); 
    }
  };

  // Add static properties to the constructor function, if supplied.
  extend(child, parent, staticProps);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function and add the prototype properties.
  child.prototype = Object.create(parent.prototype);
  extend(child.prototype, protoProps);

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;

  return child;
};

if(typeof module === "object") {
  module.exports = Compute;
}
