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

var objPop = function(obj) {
  for(var key in obj) {
    return obj[key];
  }
  return false;
}

// todo make this extendable 
var Computer = function(func) {
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
            val.compute();
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

  inner.id = ID++;
  inner.dependencies = {};
  extend(inner, proto);

  inner = inner.bind(inner);

  if(typeof func === "function") {
    inner.compute = function() {
      ContextStack.push(this);
      delete cloud[this.id];
      inner(func());
      ContextStack.pop();
    };

    inner.compute = inner.compute.bind(inner);
    inner.compute();
  } else {
    inner(func);
  }

  return inner;
};

if(typeof module === "object") {
  module.exports = Computer;
}
