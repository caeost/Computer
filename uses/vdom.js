// should reuse existing elements that have been dumped here instead of creating new elements
var dustheap = document.createElement('div');
var types = {};

function extend(target, props) {
  if(!props) return target;
  for(var key in props) {
    target[key] = props[key];
  }
  return target;
}

function renderChildren(element, parental, children) {
  for(var i = 0; i < children.length; i++) {
    // we don't have to depend on the value of the element, just that it is there
    var newEl = children[i].element;
    var old = parental._childNodes[i];
    if(old) {
      var existingEl = old.element;
      if(newEl !== existingEl) {
        element.replaceChild(newEl, existingEl);
      }
    } else {
      element.appendChild(newEl);
    }
  }
  // remove extras, should probably sever the connection between the valueHolder and the element..
  while(i++ < element.childNodes.length) {
    var rem = element.childNodes[i];
    types[rem.tagName] = (types[rem.tagName] || []).concat(rem);
    dustheap.appendChild(rem);
  }
};

function getElement(type) {
  if(types[type] && types[type].length) {
    return types[type].pop();
  } else {
    return document.createElement(type);
  }
}

var props = Object.keys(Element.prototype);
// could make this create these Computers lazily if we use getters ?
// this is only one way so far
function attachPropertyManagers(computer) {
  props.forEach(function(prop) {
    computer[prop] = Computer(function() {
      return computer()[prop];
    });
  });

  return computer;
}

// type cant be changed after the fact and we only want one element per DOM call
function DOM(type, func) {
  if(typeof type !== 'string') {
    func = type;
    type = 'div';
  }

  var valueHolder = Computer(func);
  valueHolder._childNodes = [];

  valueHolder.element = getElement(type);

  var DOMComp = Computer(function() {
    extend(valueHolder.element, valueHolder());
  });

  attachPropertyManagers(valueHolder);

  valueHolder.children = function(children) {
    var childComputer = Computer(children);

    // how is this all going to be garbage collected?
    Computer(function() {
      var created = childComputer();

      renderChildren(element, valueHolder, created);

      valueHolder._childNodes = created;
    });
    
    return valueHolder;
  };

  return valueHolder;
};
