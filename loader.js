var compute = require('./compute.js');
var vm = require('vm');
var fs = require('fs');

var log = require('debug')('computer:loader');

var registry = {};

// test function
function fetch(name) {
  log(`begin fetch: ${name}`);
  fs.readFile('./loader-tests/' + name + '.js', 'utf8', function(err, code) {
    log(`evaluate: ${name}: ${code}`);
    vm.runInNewContext(code, {
      define: define,
      demand: demand
    });
  });
}

function isArray(thing) {
  return typeof thing === 'object' && thing.length;
}

var g = 0;
function uniqueId() {
  return 'demand' + g++;
}

function demand(name, fun) {
  // if there is some function to run after the dependencies to load this is effectively a
  // define() where we don't care about looking at the value again.
  if(fun) {
    if(!isArray(name)) {
      name = [name];
    }
    return define(uniqueId(), name, fun);
  }

  // if there's an array (and no function, thats handled above) then we just load all of them
  if(isArray(name)) {
    var computes = [];
    for(var l = 0; l < name.length; l++) {
      computes.push(demand(name[l]));
    }
    return computes;
  }

  log(`demand: ${name}`);
  // modules only get registered in two ways:
  // 1) When they are being defined, which includes when they're still waiting to actually have a value
  // 2) When a module is demanded it is fetched and registered if it isn't already known about
  var registered = registry[name];
  if(registered) {
    return registered;
  } else {
    // if fetch is synchronous it will return a value which we can immediatly use, else this will be
    // undefined. fetch() should not return anything unless it is the value of the module
    var val = fetch(name);
    registry[name] = compute(val);
    return registry[name];
  }
}

function define(name, deps, fun) {
  // manipulate arguments
  var argIndex = arguments.length - 1;
  fun = arguments[argIndex--];
  if(isArray(arguments[argIndex])) {
    deps = arguments[argIndex--];

    for(var i = 0; i < deps.length; i++) {
      // register dependencies as demands if they are not already demanded
      if(!registry[deps[i]]) {
        log(`register ${deps[i]} for loading ${name}`);
        demand(deps[i]);
      }
    }
  } else {
    deps = [];
  }
  name = arguments[argIndex];

  // register this module if it hasnt been registered already by something depending on it
  if(!registry[name]) {
    registry[name] = compute();
  }
  var module = registry[name];

  // if the define is a function then it can use dependencies and we need to make sure they're loaded
  if(typeof fun === 'function') {
    var context = this;
    // this compute runs on any change in dependencies and will define/update this module if
    // all depended on modules have some value 
    compute(function() {
      var depValuez = [];
      log(`checking deps: ${JSON.stringify(deps)} for module ${name}`);
      for(var x = 0; x < deps.length; x++) {
        var depValue = registry[deps[x]]();
        if(depValue === void 0) {
          log(`module ${name} cannot finish loading yet still waiting on ${deps[x]}`);
          return;
        }
        log(`${deps[x]} has value ${depValue}`);
        depValuez.push(depValue);
      }
      var valuez = fun.apply(context, depValuez);
      log(`produce value ${valuez} for ${name}`);
      module(valuez);
    });
  } else {
    module(fun);
  }

  return module;
}

module.exports = {
  registry: registry,
  fetch: fetch,
  demand: demand,
  define: define
};
