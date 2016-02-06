var demandLib = require("./loader.js");
var demand = demandLib.demand;
var define = demandLib.define;

demand("c", function(c) {
  console.log(`this is c: ${c}`);
  var b = demand('b');
  console.log(`this is b: ${b()}`);
  b(10);
});

