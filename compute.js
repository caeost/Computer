// Big question is which side of equation should be tracking.
// If an object tracks what it depends on, it is duplicating the work of
// the interpreter and its GC, but we can also with a simple walk of the tree
// know which depends depend on other depends (if you get me) and avoid recomputing
// of values in some situations. 
// On the other hand tracking what depends on it makes it very easy to find the
// total list of dependencies even if the rest of the tree (or forest) is huge
// this could also help with avoiding memory leaks as the active objects will
// eventually shed their references (especially for generated values) and the 
// object will no longer be referenced.
//
// Can we figure out how to build the run graph in the second case as if we were
// in the first case? We could trace the found dependencies to each other,
// however this removes much efficiency as we might theoretically have to walk
// all the trees the values are in, in case the parent doesn't depend directly
// on the child. Perhaps tho if a child is not depended upon directly it could
// be run, see if it even changes, and continue to run not directly attached
// dependencies until we either can't anymore or we are done.

// ideas: 
// 1) keep list of computers that are never "gotten" and clean them up when their dependencies are all gone
// 2) add robust set (of compilable away) of debugging tools to see ex: size of trees, timing, cyclical re calls


// ID constantly counts up, can potentially be used to know if a value could reference another
var ID = 0;

// Tree is the root of all rerenders, its essentially a stripped down computer
var Tree = {
  dependencies: {},
  id: 'Tree'
};

// dirty contains the current list of values to be recalculated
// it is cleaned up after a run through of the tree is done
var dirty = [];

var done = {};

var ContextStack = [Tree];

function intersection(one, two) {
  for(var i = 0; i < one.length; i++) {
    if(two[one[i]]) return true;
  }
  return false;
}

function walkTree(tree, func) {
  var dependencies = tree.dependencies;
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
function runLeaf(tree, dirty) {
  walkTree(tree, function runIfDirty(state) {
    if(intersection(dirty, state.dependencies) && !done[state.id]) {
      console.log('computing id: ' + state.id);
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
    if(!dirty.length) {
      dirty.push(state.id);
      console.log('change on id: %s', state.id);
      runLeaf(Tree, dirty);
      console.log('changes done for ids: %s', dirty.toString());
      dirty = [];
      done = {};
    } else {
      dirty.push(state.id);
      console.log('sub change on id: %s', state.id);
      console.log('current done: %s', Object.keys(done).toString());
      runLeaf({dependencies: done}, [state.id]);
    }
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

