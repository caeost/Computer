// ideas: 
// add robust set (of compilable away) of debugging tools to see ex: size of trees, timing, cyclical re calls

function extend(target, props) {
  for(var key in props) {
    target[key] = props[key];
  }
  return target;
}

function objPeek(obj) {
  var keys = Object.keys(obj);
  if(!keys.length) return false;
  return Math.max.apply(Math, keys);
}

var Context = null;
var ID = 0;
var cloud = {};
var running = false;

function Get(rep) {
  if(cloud[this.id]) {
    rep.checker();
  }
  if(Context) {
    rep.deps[Context.id] = Context;
  }
  return rep.value
}

function Set(rep, value, options) {
  // assert may want to throw an error on bad values (at least in some environments) but compute doesn't decide that
  if (options.assert && !options.assert(value)) {
    return false;
  }
  var equals = (options.isEqual && options.isEqual(value, rep.value)) || value == rep.value;
  rep.value = value;
  if (!equals) {
    extend(cloud, rep.deps);
    if(!running) {
      running = true;
      var val;
      while((key = objPeek(cloud)) !== false) {
        cloud[key].checker();
      }
      running = false;
    }
  }
}

// runner can either be null or a sync function
// options is an optional object containing
//   - isEqual(a,b) which can determine custom equality
//   - assert(a) which gates setting values to a custom check
function Compute(runner, options) {
  options = options || {}
  var rep = {
    value: null,
    id: ID++,
    deps: {}
  }

  if (runner) {
    rep.checker = function checker() {
      var prev = Context;
      Context = rep;
      delete cloud[rep.id];
      Set(rep, runner(), options)
      Context = prev;
    };

    rep.checker()
  }

  return function(value) {
    if (arguments.length) {
      return Set(rep, value, options);
    } else {
      return Get(rep);
    }
  }
}

if (module != null && module.exports != null) {
  module.exports = Compute
}
