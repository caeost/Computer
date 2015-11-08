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

  // this pattern of wrapping the function call in another computer turns out
  // to be very useful.
  // Until (/ if) it can be cleaned up we need to do the cleanup ourselves and
  // need to know the name.
  var DOMComp = Computer(function() {
    var data = Computer();

    extend(element, data);

    return data;
  });

  // these are out here because they dont need to be used by the internal 
  // behavior much and therefore their higher reference cost don't matter
  // much.
  // Instead we want a reliable way to reference and delete them.
  var childComputer;
  var renderChildren;
  computer.children = function(children) {
    if(childComputer) {
      childComputer.destroy();
      renderChildren.destroy();
    }

    childComputer = Computer(children);

    renderChildren = Computer(function() {
      var children = childComputer();
      for(var i = 0; i < children.length; i++) {
        var existingEl = element.childNodes[i];
        var newEl = children[i].element;
        if(existingEl !== newEl) {
          if(existingEl) {
            // this removes from rendered DOM without deleting (check this)
            dustheap.appendChild(existingEl);
          }
          element.appendChild(newEl);
        }
      }

      return children;
    });

    return childComputer;
  };

  var oldDestroy = computer.destroy;
  computer.destroy = function() {
    if(childComputer) {
      childComputer.destroy();
      renderChildren.destroy();
    }
    DOMComp.destroy();
    computer.element.
    oldDestroy();
  }

  return computer;
};
