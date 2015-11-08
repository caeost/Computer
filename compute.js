// ideas: 
// 1) keep list of computers that are never "gotten" and clean them up when their dependencies are all gone

var ID = 0;

var Tree = {
  dependencies: {}
};

var dirty = {};

var ContextStack = [Tree];

function walkTree(tree, func, sibling) {
  var dependencies = tree.dependencies;
  var prev = {};
  for(var id in dependencies) {
    var bail = walkTree(dependencies[id], func, sibling);
    if(bail) return true;
    if(sibling) sibling(prev);
    prev[id] = dependencies[id];
  }
  func(tree);
}

function intersection(one, two) {
  for(var key in one) {
    if(two[key]) return true;
  }
  return false;
}

function runLeaf(tree) {
  var current;
  walkTree(tree, function(state) {
    if(intersection(dirty, state.dependencies) {
      current = state;
    }
  }, function(prev) {
    // if we rewrite dependencies to be an array we maybe don't need to
    // check previous dependencies because earlier things cant reference
    // later things and therefore be changed by things that were added later
    // i just realized tho that dependencies are created all the time and 
    // are not globally relevant necessarily THINK BOUT IT
    runLeaf({dependencies: prev});
    if(current) {
      runCompute(current);
      current = null;
    }
  });
}

function runCompute(state) {
  if(state.compute) {
    ContextStack.push(state);
    state.dependencies = {};
    if(state.compute.length) {
      var done = function(value) {
        ContextStack.push(state);
        state.thing(value);
        ContextStack.pop();
        runLeaf(Tree);
      }
      state.compute(done);
    } else {
      state.thing(state.compute());
    }
    ContextStack.pop();
  }
}

function set(state, value) {
  var old = state.value;
  state.value = value;
  if(!state.isEqual(old, value)) {
    dirty[state.id] = true;
    runLeaf(Tree);
    // this won't work with async jobs, need some book keeping...
    // maybe because they will all at least be kicked off at this
    // point its fine.
    delete dirty[state.id];
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

