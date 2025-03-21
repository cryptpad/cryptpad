var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var b64Vectors = require('./data/base64.random');

test('nacl.util.encodeBase64 random test vectors', function(t) {
  b64Vectors.forEach(function(vec) {
    var b = new Uint8Array(vec[0]);
    var s = vec[1];
    t.equal(nacl.util.encodeBase64(b), s);
    t.deepEqual(nacl.util.decodeBase64(s), b);
  });
  t.end();
});

