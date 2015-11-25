// Realization: IF we keep track of just who depends on the object then we can make a big list and simply 
// start running through it, along the way as we 'get' other computes if those are in the list and therefore
// 'dirty' dependencies, we can simply run their compute first as it is all sync. This would eliminate accidental
// cycling of computes where more then one compute depends on a changed value and at least one of those computes
// also depends on another one in that set. This way we also dont need to trace out the dependency graph, the 
// running of the function does it for us. We could go even further with laziness and only recompute dirty values
// when something 'get's them, but that seems less useful in the context of web development where you often want
// side effects / want to inform what are effectively listeners.

// ideas: 
// 1) add robust set (of compilable away) of debugging tools to see ex: size of trees, timing, cyclical re calls


// ID constantly counts up, can potentially be used to know if a value could reference another

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

  if(func) {
    inner.compute = function() {
      ContextStack.push(this);
      delete cloud[this.id];
      inner(func());
      ContextStack.pop();
    };

    inner.compute = inner.compute.bind(inner);
    inner.compute();
  }

  return inner;
};

module.exports = Computer;
