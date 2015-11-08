var Computer = require('./compute.js');

var dustheap = document.createElement('div');

function extend(target, props) {
  for(var key in props) {
    target[key] = props[key];
  }
  return target;
}

// type cant be changed after the fact and we only want one element per DOM call
function DOM(type, func) {
  if(typeof type !== 'string') {
    func = type;
    type = 'div';
  }

  var computer = Computer(func || {});

  var element = computer.element = document.createElement(type);

  Computer(function() {
    var data = Computer();

    extend(element, data);

    return data;
  });

  var childComputer;
  computer.children = function(children) {
    childComputer = Computer(children);

    var renderChildren = Computer(function() {
      var children = childComputer();
      var offset = 0;
      for(var i = 0; i < children.length; i++) {
        var existingPos = i - offset;
        var existingEl = existingPos > -1 ? element.childNodes[existingPos] : null;
        var newEl = children[i].element;
        if(existingEl !== newEl) {
          offset++;
          if(existingEl) {
            dustheap.appendChild(existingEl);
          }
          element.appendChild(newEl);
        }
      }

      return children;
    });

    childComputer.renderChildren = renderChildren;

    return childComputer;
  };

  var oldDestroy = computer.destroy;
  computer.destroy = function() {
    if(childComputer.renderChildren) {
      childComputer.renderChildren.destroy();
    }
    childComputer.destroy();
    computer.element.
    oldDestroy();
  }

  return computer;
};
