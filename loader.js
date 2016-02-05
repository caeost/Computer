var compute = require('./compute.js');
var vm = require('vm');
var fs = require('fs');

var log = console.log;

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
  if(fun) {
    if(!isArray(name)) {
      name = [name];
    }
    return define(uniqueId(), name, fun);
  }

  if(isArray(name)) {
    var computes = [];
    for(var l = 0; l < name.length; l++) {
      computes.push(demand(name[l]));
    }
    return computes;
  }

  log(`demand: ${name}`);
  var registered = registry[name];
  if(registered && registered() !== void 0) {
    return registered;
  } else {
    var val = fetch(name);
    registry[name] = compute(val);
    return registry[name];
  }
}

function define(name, deps, fun) {
  var argIndex = arguments.length - 1;
  fun = arguments[argIndex--];
  if(isArray(arguments[argIndex])) {
    deps = arguments[argIndex--];

    for(var i = 0; i < deps.length; i++) {
      if(!registry[deps[i]]) {
        log(`register ${deps[i]} for loading ${name}`);
        registry[deps[i]] = demand(deps[i]);
      }
    }
  } else {
    deps = [];
  }
  mame = arguments[argIndex];
  if(!registry[name]) {
    registry[name] = compute();
  }

  var context = this;
  compute(function() {
    var depValuez = [];
    log(`checking deps: ${JSON.stringify(deps)} for module ${name}`);
    for(var x = 0; x < deps.length; x++) {
      log(`check dep: ${deps[x]}`);
      var depValue = registry[deps[x]]();
      if(depValue === void 0) {
        log(`module ${name} cannot finish loading yet still waiting on ${deps[x]}`);
        return void 0;
      }
      log(`${deps[x]} has value ${depValue}`);
      depValuez.push(depValue);
    }
    var valuez = fun.apply(context, depValuez);
    log(`produce value ${valuez} for ${name}`);
    registry[name](valuez);
  });

  return registry[name];
}

module.exports = {
  registry: registry,
  fetch: fetch,
  demand: demand,
  define: define
};
