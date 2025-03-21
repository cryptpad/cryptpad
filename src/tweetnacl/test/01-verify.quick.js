var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

test('nacl.verify', function(t) {
  t.ok(nacl.verify(new Uint8Array(1), new Uint8Array(1)), 'equal arrays of length 1 should verify');
  t.ok(nacl.verify(new Uint8Array(1000), new Uint8Array(1000)), 'equal arrays of length 1000 should verify');
  var a = new Uint8Array(764), b = new Uint8Array(764);
  for (i = 0; i < a.length; i++) a[i] = b[i] = i & 0xff;
  t.ok(nacl.verify(a, b), 'equal arrays should verify');
  t.ok(nacl.verify(a, a), 'same arrays should verify');
  b[0] = 255;
  t.notOk(nacl.verify(a, b), 'different arrays don\'t verify');
  t.notOk(nacl.verify(new Uint8Array(1), new Uint8Array(10)), 'arrays of different lengths should not verify');
  t.notOk(nacl.verify(new Uint8Array(0), new Uint8Array(0)), 'zero-length arrays should not verify');
  t.end();
});
