// should reuse existing elements that have been dumped here instead of creating new elements
var dustheap = document.createElement('div');
var types = {};

function extend(target, props) {
  for(var key in props) {
    target[key] = props[key];
  }
  return target;
}

var renderChildren = function(element, parental, children) {
  for(var i = 0; i < children.length; i++) {
    // we don't have to depend on the value of the element, just that it is there
    var newEl = children[i].element;
    var old = parental.childNodes[i];
    if(old) {
      var existingEl = old.element;
      if(newEl !== existingEl) {
        element.replaceChild(newEl, existingEl);
      }
    } else {
      element.appendChild(newEl);
    }
  }
  // remove extras
  while(i++ < element.childNodes.length) {
    dustheap.appendChild(element.childNodes[i]);
  }
};

function getElement(type) {
  if(types[type] && types[type].length) {
    return types[type].pop();
  } else {
    return document.createElement(type);
  }
}

// type cant be changed after the fact and we only want one element per DOM call
function DOM(type, func) {
  if(typeof type !== 'string') {
    func = type;
    type = 'div';
  }

  var computer = Computer(func);
  computer.childNodes = [];

  var element = computer.element = getElement(type);

  var DOMComp = Computer(function() {
    var data = computer();

    if(data) {
      extend(element, data);
    }
  });

  computer.children = function(children) {
    var childComputer = Computer(children);

    Computer(function() {
      var created = childComputer();

      renderChildren(element, computer, created);

      computer.childNodes = created;
    });
    
    return computer;
  };

  return computer;
};
