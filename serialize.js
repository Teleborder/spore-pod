module.exports = serialize;

function serialize(type, data) {
  var out = {},
      types = {
        user: {
          list: 'email',
          item: {
            email: 'email'
          }
        },
        cell: {
          list: 'uid',
          item: {
            id: 'uid',
            key: 'key',
            value: 'value'
          }
        },
        app: {
          list: 'uid',
          item: {
            id: 'uid', 
            name: 'name',
            owner: 'owner.email'
          }
        }
      };

  if(Array.isArray(data)) {

    out[pluralize(type)] = data.map(function (datum) {
      if(types[type]) {
        return getProp(datum, types[type].list);
      }
      
      return datum;
    });

  } else {

    out[type] = {};

    if(types[type]) {

      Object.keys(types[type].item).forEach(function (prop) {
        var src = types[type].item[prop];

        out[type][prop] = getProp(data, src);
      });

    } else {
      out[type] = data;
    }

  }
  
  return out;
}

function pluralize(str) {
  return str + 's';
}

function getProp(obj, prop) {
  var firstDot = prop.indexOf('.');

  if(obj === undefined) {
    return obj;
  }

  if(firstDot === -1) {
    if(typeof obj[prop] === 'function') {
      return obj[prop]();
    }
    return obj[prop];
  }

  if(typeof obj[strBefore(prop, firstDot)] === 'function') {
    return getProp(obj[strBefore(prop, firstDot)](), strAfter(prop, firstDot));
  }

  return getProp(obj[strBefore(prop, firstDot)], strAfter(prop, firstDot));
}

function strBefore(str, index) {
  return str.substring(0, index);
}

function strAfter(str, index) {
  return str.substring(index + 1);
}
