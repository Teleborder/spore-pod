var Cell = require('../models/cell'),
    serialize = require('../serialize');

// Create a cell
exports.create = function (req, res, next) {
  Cell.create(
    req.body.id,
    {
      key: req.body.key,
      value: req.body.value,
      app: req.app._id,
      environment: req.params.env_name,
      creator: req.user._id
    },
    function (err, cell) {
      if(err) return next(err);
      res.json(serialize('cell', cell));
    }
  );
};

// Show a single cell
exports.show = function (req, res, next) {
  Cell.get(req.app._id, req.params.env_name, req.params.cell_id, function (err, cell) {
    if(!err && !cell) {
      err = new Error("No Such Cell");
      err.status = 404;
    }
    if(err) return next(err);

    res.set('Cache-Control', "max-age=31536000");
    res.json(serialize('cell', cell));
  });
};
