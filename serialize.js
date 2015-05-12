module.exports = serialize;

function serialize(type, data) {
  var out = {},
      types = {
        user: {
          list: 'email',
          item: ['email', 'key']
        },
        app: {
          list: 'name',
          item: ['_id', 'name', 'owner.email']
        },
        environment: {
          list: 'name',
          item: ['name', 'values']
        }
      };

  if(Array.isArray(data)) {
    out[pluralize(type)] = data.map(function (datum) {
      return getProp(datum, types[type].list);
    });
  } else {
    out[type] = {};
    types[type].item.forEach(function (prop) {
      setProp(out[type], prop, getProp(data, prop));
    });
  }
  
  return out;
}

function pluralize(str) {
  return str + 's';
}

function setProp(obj, prop, val) {
  var firstDot = prop.indexOf('.');

  if(firstDot === -1) {
    return obj[prop] = val;
  }

  if(!obj[strBefore(prop, firstDot)]) {
    obj[strBefore(prop, firstDot)] = {};
  }

  return setProp(obj[strBefore(prop, firstDot)], strAfter(prop, firstDot), val);
}

function getProp(obj, prop) {
  var firstDot = prop.indexOf('.');

  if(obj === undefined) {
    return obj;
  }

  if(firstDot === -1) {
    return obj[prop];
  }

  return getProp(obj[strBefore(prop, firstDot)], strAfter(prop, firstDot));
}

function strBefore(str, index) {
  return str.substring(0, index);
}

function strAfter(str, index) {
  return str.substring(index + 1);
}
