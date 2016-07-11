var express = require('express');
var path = require('path');
var nforce = require('nforce');
var hbs = require('hbs');
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');

var app = express();

app.set('view engine', 'hbs');
app.enable('trust proxy');

var org;
if (isSetup()) {
  org = nforce.createConnection({
    clientId: process.env.CONSUMER_KEY,
    clientSecret: process.env.CONSUMER_SECRET,
    redirectUri: process.env.CALLBACK_URL, //oauthCallbackUrl(req),
    mode: 'single'
  });
}
var oauthCode;


function isSetup() {
  return (process.env.CONSUMER_KEY != null) && (process.env.CONSUMER_SECRET != null);
}

function oauthCallbackUrl(req) {
  //return req.protocol + '://' + req.get('host');
  return process.env.process.env.CALLBACK_URL;
}

hbs.registerHelper('get', function(field) {
  return this.get(field);
});



app.post('/form', function(req, res) {
    console.log('************************************');
    console.log('req is');
    console.log(req.query.code);

    // Parse a form
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      //res.writeHead(200, {'content-type': 'text/plain'});
      //res.write('Received form:\n\n');
      //res.end(util.inspect(fields));
      var bodyContentA  = util.inspect(fields);
      var bodyContent   = '{ "firstName" : "' + fields.firstName + '", "lastName" :  "' + fields.lastName + '", "email":  "' + fields.email + '", "company" :  "' + fields.company + '", "description" :  "' + fields.description + '" , "type":  "' + fields.type + '" }';
        org.authenticate({ username: process.env.SFUSER, password: process.env.SFPASS, securityToken: process.env.SFTOKEN}, function(err) {
          console.log('**************************ERR???*******************');
          console.log(err);
          console.log('**************************ERR???*******************');
          if (!err) {
              console.log('**************************bodyContent*******************');
              console.log(bodyContent);
              console.log('**************************bodyContent*******************');
              console.log('**************************bodyContentA*******************');
              console.log(bodyContentA);
              console.log('**************************bodyContentA*******************');
            org.apexRest({ uri: 'contactUs', method:'POST', body: bodyContent }, function(err, result) {
              console.log('**************************apexRest*******************');
              console.log(err);
              console.log(result);
              console.log('**************************apexRest*******************');
              if(!err) {
                console.log(result);
                res.send(result);
              }else{
                console.log(result);
                res.send(result);
              }
            });
          }
          else {
            if (err.message.indexOf('invalid_grant') >= 0) {
              res.redirect('/');
            }
            else {
              res.send(err.message);
            }
          }
        });
    });



    return;

});



app.get('/', function(req, res) {
  if (isSetup()) {
    /*var org = nforce.createConnection({
      clientId: process.env.CONSUMER_KEY,
      clientSecret: process.env.CONSUMER_SECRET,
      redirectUri: oauthCallbackUrl(req),
      mode: 'single'
    });*/

    if (req.query.code !== undefined) {
      console.log('************************************');
      console.log('req is');
      console.log(req.query.code);
      // authenticated

      oauthCode     = req.query;
      org.authenticate(oauthCode, function(err) {
        if (!err) {
          org.query({ query: 'SELECT id, name, type, industry FROM Account' }, function(err, results) {
            if (!err) {
              var body = {
                "uri" : "/contactUs/",
                "method" : "post", 
                "body" : {"firstName" : "test",  "lastName" : "test2",  "email" : "test2@test.com",  "company" : "co",  "description" : "desc",  "type" : "test" }
              };


              res.render('index', {records: results.records});
            }
            else {
              res.send(err.message);
            }
          });
        }
        else {
          if (err.message.indexOf('invalid_grant') >= 0) {
            res.redirect('/');
          }
          else {
            res.send(err.message);
          }
        }
      });
    }
    else {
      res.redirect(org.getAuthUri());
    }
  }
  else {
    res.redirect('/setup');
  }
});

app.get('/setup', function(req, res) {
  if (isSetup()) {
    res.redirect('/');
  }
  else {
    var isLocal = (req.hostname.indexOf('localhost') == 0);
    var herokuApp = null;
    if (req.hostname.indexOf('.herokuapp.com') > 0) {
      herokuApp = req.hostname.replace(".herokuapp.com", "");
    }
    res.render('setup', { isLocal: isLocal, oauthCallbackUrl: oauthCallbackUrl(req), herokuApp: herokuApp});
  }
});

app.listen(process.env.PORT || 5000);
