define([
    '/sign/vendor/forge.all.min.js',
], function (forge) {
  var _pkcsSigner = {};
 
  var setSframeChannel = function(channel) {
     _pkcsSigner.channel = channel;
  }
 
  var loadModule = function(passphrase) {
     _pkcsSigner.passphrase = passphrase;
     console.log("WEBEXT in loadModule");
     console.log("WEBEXT ", data.channel);
  }

  var closeModule = function() {
     _pkcsSigner.passphrase = "";
     console.log("WEBEXT in closeModule");
  }

  var getCertificate = async function() {
    console.log("WEBEXT in getCertificate");
    return new Promise(function(myResolve, myReject) {
      // sending message to web extension
      _pkcsSigner.channel.query("Q_GET_CERTIFICATE", { data : "", passphrase : _pkcsSigner.passphrase }, async function(err, data) {
        console.log("WEBEXT in getCertificate cb ", data);
        var certdata = JSON.parse(forge.util.decode64(data));
        console.log("CERT ", certdata);
        myResolve(certdata);
      });
    });
  }

  var signPkcs11 = async function(digest) {
    console.log("WEBEXT in sign ", digest);
    var data = btoa(digest.getBytes());
    return new Promise(function(myResolve, myReject) {
      // sending message to web extension
      console.log("WEBEXT in sign send message");
      _pkcsSigner.channel.query("Q_SIGN_DOCUMENT", { data : data, passphrase : _pkcsSigner.passphrase }, async function(err, data) {
        console.log("WEBEXT in sign cb ", data);
        var signdata = forge.util.decode64(data); 
        console.log("WEBEXT SIGN DATA ", signdata);
        myResolve(signdata);
      });
    });
  }

  return {
       setSframeChannel: setSframeChannel,
       loadModule: loadModule,
       closeModule: closeModule, 
       getCertificate: getCertificate,
       signPkcs11: signPkcs11 
    };
});

