var Hmmac = require('hmmac'),
    User = require('./models/user');

var hmmac = new Hmmac({
  algorithm: 'sha256',
  acceptableDateSkew: 300,
  credentialProvider: User.getSecretByKey,
  credentialProviderTimeout: 5,
  signatureEncoding: 'hex',
  wwwAuthenticateRealm: 'API',
  scheme: Hmmac.schemes.load('plain')
});

hmac.getKey = function (req) {
  return this.config.schemes.parseAuthorization.call(this, req).key;
};


module.exports = hmmac;
