var demandLib = require("./loader.js");
var demand = demandLib.demand;
var define = demandLib.define;

demand("c", function(c) {
  console.log(`this is c: ${c}`);
  debugger;
  demand('a')(10);
  console.log(`this is a: ${demand('a')()} after`);
  console.log(`this is c: ${c} after`);
});

