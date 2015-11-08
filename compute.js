// ideas: 
// 1) keep list of computers that are never "gotten" and clean them up when their dependencies are all gone

var ID = 0;

var Tree = {
  dependencies: {}
};

var ContextStack = [Tree];

function walkTree(tree, func, sibling) {
  var dependencies = tree.dependencies;
  func(tree);
  for(var id in dependencies) {
     var bail = walkTree(dependencies[id], func, sibling);
     if(bail) return true;
     if(sibling) sibling();
  }
}

function markDirty(id) {
  walkTree(Tree, function(state) {
    state.dirty || (state.dirty = !!state.dependencies[id]);
  });
}

function runLeaf() {
  var leafs = [];

  var current;
  walkTree(Tree, function(state) {
    if(state.dirty && !state.running) {
      current = state;
    }
  }, function() {
    //TODO do runCompute here to prevent walking tree too much
    if(current) {
      leafs.push(current);
      current = null;
    }
  });

  if(

  while(leafs.length) {
    var candidate = leafs.pop();
    if(candidate.dirty) {
      var stillLeaf = true;
      walkTree(candidate, function(state) {
        stillLeaf = stillLeaf && !state.dirty;
        if(!stillLeaf) return true;
      });
      if(stillLeaf) {
        runCompute();
      }
    }
  }
}

function runCompute(state) {
  if(state.compute) {
    ContextStack.push(state);
    state.dependencies = {};
    if(state.compute.length) {
      var done = function(value) {
        ContextStack.push(state);
        state.thing(value);
        state.running = false;
        state.dirty = false;
        ContextStack.pop();
        runLeaf();
      }
      state.running = true;
      state.compute(done);
    } else {
      state.thing(state.compute());
      state.dirty = false;
    }
    ContextStack.pop();
  }
}

function set(state, value) {
  var old = state.value;
  state.value = value;
  if(!state.isEqual(old, value)) {
    markDirty(state.id, Tree);
    runLeaf();
  }
  return value;
}

function get(state) {
  var context = ContextStack[ContextStack.length - 1];
  context.dependencies[state.id] = state;
  return state.value;
}

var Computer = function(func) {
  var initial;

  if(typeof func !== 'function') {
    initial = func;
    func = void 0;
  }

  var state = {
    id: ID++,
    dependencies: {},
    isEqual: function(a, b) {
      return a === b;
    },
    compute: func
  };

  var that = function(value) {
    if(arguments.length > 0) {
      return set(state, value);
    } else {
      return get(state);
    }
  };

  that.toJSON = that;

  state.thing = that;

  that.state = state;

  // TODO make cleanup function
  that.destroy = function() {
    walkTree(Tree, function(state) {
      delete state.dependencies[that.id];
    });
  };

  if(!func) {
    that(initial);
  } else {
    runCompute(state);
  }
  
  // hack
  that();

  return that;
};

if(module && module.exports) {
  module.exports = Computer;
}
