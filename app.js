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
    // Parse a form
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      //var bodyContent   = '{ "firstName" : "' + fields.firstName + '", "lastName" :  "' + fields.lastName + '", "email":  "' + fields.email + '", "company" :  "' + fields.company + '", "description" :  "' + fields.description + '" , "type":  "' + fields.type + '" }';
      var bodyContentJson = '{ "submission" : { "firstName" : "' + fields.firstName + '", "lastName" :  "' + fields.lastName + '", "email":  "' + fields.email + '", "company" :  "' + fields.company + '", "description" :  "' + fields.description + '" , "type":  \"' + fields.type + '\" } }';

      var fieldsJson      = JSON.stringify(fields);
      var bodyContentObj  = new Object();
        bodyContentObj.submission   = fieldsJson;
      var bodyContent     = JSON.stringify(bodyContentObj);

      console.log('*************************fieldsJson***********************');
      console.log(fieldsJson);
      console.log('*************************/fieldsJson***********************');

      console.log('*************************bodyContentObj***********************');
      console.log(bodyContentObj);
      console.log('*************************/bodyContentObj***********************');

      console.log('*************************bodyContent***********************');
      console.log(bodyContent);
      console.log('*************************/bodyContent***********************');

      console.log('*************************bodyContentJson***********************');
      console.log(bodyContentJson);
      console.log('*************************/bodyContentJson***********************');


        org.authenticate({ username: process.env.SFUSER, password: process.env.SFPASS, securityToken: process.env.SFTOKEN}, function(err) {
          if (!err) {
            org.apexRest({ uri: 'contactUs', method:'POST', body: bodyContentJson }, function(err, result) {
              if(!err) {
                res.send("Thank you, your request has been processed");
              }else{
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
  res.render('index'); 
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
