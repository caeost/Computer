// ideas: 
// 1) keep list of computers that are never "gotten" and clean them up when their dependencies are all gone
// 2) add robust set (of compilable away) of debugging tools to see ex: size of trees, timing, cyclical re calls


// ID constantly counts up, can potentially be used to know if a value could reference another
var ID = 0;

// Tree is the root of all rerenders, its essentially a stripped down computer
var Tree = {
  dependencies: {}
};

// dirty contains the current list of values to be recalculated
// it is cleaned up after a run through of the tree is done
var dirty = {};

var running = false;

var done = {};

var ContextStack = [Tree];

function intersection(one, two) {
  for(var key in one) {
    if(two[key]) return true;
  }
  return false;
}

function walkTree(tree, func) {
  var dependencies = tree.dependencies;
  done = {};
  for(var id in dependencies) {
    walkTree(dependencies[id], func);
    done[id] = dependencies[id];
  }
  func(tree);
}

// check previous dependencies because earlier things cant reference
// later things and therefore be changed by things that were added later
// i just realized tho that dependencies are created all the time and 
// are not globally relevant necessarily THINK BOUT IT
function runLeaf(tree) {
  running = true;
  walkTree(tree, function runIfDirty(state) {
    if(intersection(dirty, state.dependencies)) {
      runCompute(state);
    }
  });
}

function runCompute(state) {
  if(state.compute) {
    ContextStack.push(state);
    state.dependencies = {};
    state.thing(state.compute());
    ContextStack.pop();
  }
}

function set(state, value) {
  var old = state.value;
  state.value = value;
  if(!state.isEqual(old, value)) {
    dirty[state.id] = true;
    if(!running) {
      runLeaf(Tree);
      running = false;
    } else {
      runLeaf({dependencies: done});
    }
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

  var computer = function(value) {
    if(arguments.length > 0) {
      return set(state, value);
    } else {
      return get(state);
    }
  };

  computer.toJSON = computer;

  state.thing = computer;

  computer.state = state;

  computer.destroy = function() {
    state.compute = function() {};
    walkTree(Tree, function(state) {
      delete state.dependencies[that.id];
    });
  };

  if(!func) {
    computer(initial);
  } else {
    runCompute(state);
  }

  // hack
  computer();

  return computer;
};

