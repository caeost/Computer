function(window) {
  var $ = document.querySelectorAll;
  function on(el, event, fn) {
    el.addEventListener(event, fn, false);
  }

  // constants
  var ENTER_KEY = 13;

  var mainInput = $('.new-todo')[0];

  var inputValue = compute();
  on(mainInput, 'keydown', function(e) {
    if(e.char === ENTER_KEY) {
      inputValue(mainInput.value.trim()));
    }
  });

  var todos = [];
}(window);
