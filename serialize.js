module.exports = serialize;

var types = {
  user: {
    list: 'email',
    item: {
      email: 'email',
      verified: 'verified'
    }
  },
  key: {
    list: '@',
    item: '@'
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
  },
  membership: {
    list: 'email',
    item: {
      email: 'email',
      status: 'status'
    }
  },
  invite: {
    list: 'email',
    item: {
      email: 'email',
      app: 'app',
      environment: 'environment'
    }
  }
};

function serialize(type, data) {
  if(!types[type]) throw new Error("`" + type + "` is not supported for serialization.");

  if(Array.isArray(data)) {
    return serialize.arr(type, data);
  }

  return serialize.obj(type, data);
}

serialize.obj = function (type, obj) {
  var out = {};

  if(typeof types[type].item === 'object') {
    out[type] = {};

    Object.keys(types[type].item).forEach(function (prop) {
      var src = types[type].item[prop];

      out[type][prop] = getProp(obj, src);
    });

  } else {
    out[type] = getProp(obj, types[type].item);
  }

  return out;
};

serialize.arr = function (type, arr) {
  var out = {};

  out[pluralize(type)] = arr.map(function (obj) {
    return getProp(obj, types[type].list);
  });

  return out;
};

function pluralize(str) {
  return str + 's';
}

function getProp(obj, prop) {
  var props;

  if(obj === undefined) return obj;
  if(!prop) return obj;

  props = prop.split('.');
  prop = props.shift();

  if(prop !== '@') {
    obj = obj[prop];
  }

  return getProp(obj, props.join('.'));
}
