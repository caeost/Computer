var demandLib = require("./loader.js");
var demand = demandLib.demand;
var define = demandLib.define;

demand("c", function(c) {
  console.log(`this is c: ${c}`);
  demand('b')(10);
  console.log(`this is c: ${c} after`);
});

