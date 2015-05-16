var fs = require('fs'),
    path = require('path'),
    mandrill = require('mandrill-api/mandrill'),
    mandrillClient = new mandrill.Mandrill(process.env.MANDRILL_APIKEY),
    marked = require('marked'),
    confirmTemplate = fs.readFileSync(path.resolve(__dirname, 'emails', 'confirm.md'));

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

exports.confirm = function (user, token, callback) {
  var subject,
      message,
      email;
      

  email = user.email;
  subject = "Confirm your Spore account";
  message = template(confirmTemplate, {
    token: token,
    email: email
  });

  send(email, subject, message, callback);
};

exports.invite = function (params, callback) {
  var subject,
      message;

  subject = "Invitation to collaborate on " + params.app.name;
  message = template(confirmTemplate, {
    token: params.token,
    appName: params.app.name,
    fromEmail: params.from.email,
    email: params.to
  });

  send(params.to, subject, message, callback);
};

function template(temp, content) {
  content = content || {};
  Object.keys(content).forEach(function (key) {
    key = key.toUpperCase();

    var re = new RegExp("\[\[" + key + "\]\]", "g");
    temp = temp.replace(re, content);
  });

  return temp;
}

function send(to, subject, body, callback) {

  var message = {
    text: body,
    html: marked(body),
    subject: subject,
    from_email: "hello@spore.sh",
    from_name: "Spore",
    to: [
      {
        email: to.email
      }
    ]
  };

  mandrillClient.messages.send({
    message: message,
    async: false,
    ip_pool: "Main Pool"
  }, function (result) {
    if(result && result[0]) {
      if(result[0].status === 'rejected') {
        return callback(new Error("Mail to " + result[0].email + " rejected: " + result[0].reject_reason));
      }
      if(result[0].status === 'invalid') {
        return callback(new Error("Mail to " + result[0].email + " is invalid"));
      }
    }

    callback(null, result[0]);
  }, function (err) {
    callback(err || new Error("Unknown mail error"));
  });
}
