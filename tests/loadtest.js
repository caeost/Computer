var demandLib = require("./loader.js");
var debug = require('debug')('tests:loadtest');
var demand = demandLib.demand;
var define = demandLib.define;

demand("c", function(c) {
  debug(`this is c: ${c}`);
  var b = demand('b');
  debug(`this is b: ${b()}`);
  b(10);
});

