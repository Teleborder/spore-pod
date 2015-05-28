var Tomb = require('tomb'),
    tomb = new Tomb();

tomb.unseal([process.env.SHARD1, process.env.SHARD2, process.env.SHARD3]);

module.exports = tomb;
