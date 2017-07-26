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

function Get(context) {
  if(cloud[this.id]) {
    context.checker();
  }
  if(Context) {
    this.deps[Context.id] = Context;
  }
  return rep.value
}

function Set(context, value, options) {
  // assert may want to throw an error on bad values (at least in some environments) but compute doesn't decide that
  if (options.assert && !options.assert(value)) {
    return false;
  }

  if ((!options.isEqual || !options.isEqual(value, context.value)) || value != context.value) {
    extend(cloud, context.deps);
    if(!running) {
      running = true;
      var val;
      while((key = objPeek(cloud)) !== false) {
        cloud[key].checker();
      }
      running = false;
    }
  }
  rep.value = value;
}

// runner can either be null or a sync function
// options is an optional object containing
//   - isEqual(a,b) which can determine custom equality
//   - assert(a) which gates setting values to a custom check
function Compute(runner, options) {
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
