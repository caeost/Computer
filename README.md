# Computer

I was thinking about how so many libraries are about organizing asynchronous events / reacting to changing states, but they also do so many other things, things I don't really want to implement. So I decided to just play around and create a really small library for tying data to other data.

This grew out of some ad-hoc code I threw together at a previous place of employment. This time its a fair bit more thought through and quite a bit a cleaner.

It's probably not very useful since it won't perform any real use, I think its theoretically pretty useful as a building block though.

### How it works

You can instantiate two different kinds of Computers
  - Basic value holding ones
  - computing ones


The basic ones are simply a function around a value: calling it without arguments gets the value, calling it with an argument sets a value. They are whatever value they were last set as.

Computing values get passed a function (compute function) to determine their value. Whatever the compute function returns becomes the value of the Computer. The function is immediately executed upon creation to create an initial value. The function will track any other Computers that it got a value from during the course of this execution and watch for changes in them. If the function evaluation produces a different value (according to an overridable isEqual call) then it will trigger a change to any listeners that it has. 

You can pass a few options to the computer as a second argument during the initial setup. You can use a custom `isEqual` function that is optimized for whatever you need: comparing html nodes for a virtual dom implementation, simple comparisons for basic objects, deep comparisons if necessary, hashed comparisons for big sets, whatever for whatever. You can also supply an `assert`function which will gate the values on set, all it will do is ignore any sets (whether direct or from the compute function) but making it throw errors or log may be a good idea depending on your needs.

### Future directions

  - I want to do some work profiling and optimizing the code, seems kinda fun. 
  - Adding object/array/iterator integrations for loops and core collection functionality
  - Make sure it works well with generators in general
  - Adding tests.
  - Seeing what kind of projects I can use it for!

### Other things in here

Various implementations experimenting on top of Computer, they may not work, someday I should add tests.
