var fs = require('fs');

/**
 * A sample TCP microservice for point-to-point communication with the seneca-service-api
 * @param options
 */
function facebook(options) {
  var log;

  this.add('init:facebook', init);
  this.add('role:facebook,cmd:*', noMatch);
  this.add('role:facebook,cmd:feed', feed);

  function init(msg, respond) {
    // Note, all the code below is optional
    // log to a custom file
    fs.open(options.logfile, 'a', function (err, fd) {

      // cannot open for writing, so fail
      // this error is fatal to Seneca
      if (err) return respond(err);

      log = makeLog(fd);
      respond();
    });
  }

  function makeLog(fd) {
    // TODO: Tie this into something like Winston
    return function (entry) {
      fs.write(fd, '\n' + new Date().toISOString() + ' ' + entry, null, 'utf8', function (err) {
        if (err) return console.log(err);

        // ensure log entry is flushed
        fs.fsync(fd, function (err) {
          if (err) return console.log(err);
        })
      });
    }
  }

  function noMatch(payload, respond) {
    respond(null, {
      statusCode: 404,
      original: payload,
      error: {
        message: 'Invalid service command'
      }
    });
  }

  function feed(payload, respond) {
    // TODO: Your service begins here
    log('RECEIVED: ' + JSON.stringify(payload));
    respond(null, {status: 'success', feed: []});
  }
}

// Define queues
require('seneca')()
  .use(facebook, { logfile: './facebook.log'})
  .use('seneca-transport')
  .listen({
    type: 'tcp',
    port: process.env.SERVICE_PORT || 30301,
    pin: 'role:facebook,cmd:*'
  });