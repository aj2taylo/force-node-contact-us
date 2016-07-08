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
      //res.writeHead(200, {'content-type': 'text/plain'});
      //res.write('Received form:\n\n');
      //res.end(util.inspect(fields));


      if (req.query.code !== undefined) {
        console.log('req is');
        console.log(req);
        // authenticated
        org.authenticate(req.query, function(err) {
          res.end(err);
          /*if (!err) {
            org.apexRest({ uri: 'contactUs', method:'POST', body: fields }, function(err, result) {
              if(!err) {
                console.log(resp);
                res.send(resp);
              }else{
                console.log(err);
                res.send(err);
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
          */
        });
      } else {
        res.redirect(org.getAuthUri());
      }
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
      console.log('req is');
      console.log(req);
      // authenticated
      org.authenticate(req.query, function(err) {
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
