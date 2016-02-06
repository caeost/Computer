// ideas: 
// 1) add robust set (of compilable away) of debugging tools to see ex: size of trees, timing, cyclical re calls
// 2) ID constantly counts up, can potentially be used to know if a value could reference another

function extend(target, props) {
  for(var key in props) {
    target[key] = props[key];
  }
  return target;
}

var ContextStack = [];
var ID = 0;
var cloud = {};
var running = false;

var proto = {
};

var objPop = function(obj) {
  for(var key in obj) {
    return obj[key];
  }
  return false;
}

var inner = function Computer(value) {
  if(arguments.length) {
    var old = this.value;
    this.value = value;
    if(!this.isEqual(value, old)) {
      extend(cloud, this.dependencies);
      if(!running) {
        running = true;
        var val;
        while(val = objPop(cloud)) {
          val.inner.compute();
        }
        running = false;
      }
    }
  } else {
    if(cloud[this.id]) {
      this.compute();
    }
    var context = ContextStack[ContextStack.length - 1];
    if(context) {
      this.dependencies[context.id] = context;
    }
  }

  return this.value;
};

// todo make this extendable 
var Computer = function(func) {
  var context = {};
  context.id = ID++;
  context.dependencies = {};
  extend(context, Computer.prototype);

  var local = context.inner = inner.bind(context);
  local.context = context;

  if(typeof func === "function") {
    context.inner.compute = function() {
      ContextStack.push(this);
      delete cloud[this.id];
      this.inner(func());
      ContextStack.pop();
    }.bind(context);

    local.compute();
  } else {
    local(func);
  }

  return local;
};
Computer.prototype = {
  destroy: function destroy() {
    this.state.compute = function() {};
    walkTree(Tree, function(state) {
      delete state.dependencies[that.id];
    });
  },
  toJSON: function toJSON() {
    return this.get();
  },
  isEqual: function(a,b) {
    return a === b;
  }
};

if(typeof module === "object") {
  module.exports = Computer;
}
