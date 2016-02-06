var Computer = require('./compute.js');

// basic functionality
var a = Computer();
var b = Computer(function() {
  return a() * 2;
});

console.assert(isNaN(b()), 'b is not not a number as it should be b is ' + b());

a(2);
console.assert(a() === 2, 'a is not 2 it is ' + a());
console.assert(b() === 4, 'b is not 4 it is ' + b());

a(3);
console.assert(a() === 3, 'a is not 3 it is ' + a());
console.assert(b() === 6, 'b is not 6 it is ' + b());

var c = Computer(function() {
  return a() + b();
})

console.assert(c() === 9, 'c is not 9 it is ' + c());
a(0);
console.assert(c() === 0, 'c is not 0 it is ' + c());

// configuring the Computers
