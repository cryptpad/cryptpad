var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var testBytes = new Uint8Array([208,159,209,128,208,184,208,178,208,181,209,130,44,32,78,97,67,108]);
var utf8String = "Привет, NaCl";
var b64String = "0J/RgNC40LLQtdGCLCBOYUNs";

test('nacl.util.decodeUTF8', function(t) {
  t.plan(1);
  t.deepEqual(nacl.util.decodeUTF8(utf8String), testBytes);
});

test('nacl.util.encodeUTF8', function(t) {
  t.plan(1);
  t.equal(nacl.util.encodeUTF8(testBytes), utf8String);
});

test('nacl.util.decodeBase64', function(t) {
  t.plan(1);
  t.deepEqual(nacl.util.decodeBase64(b64String), testBytes);
});

test('nacl.util.encodeBase64', function(t) {
  t.plan(1);
  t.equal(nacl.util.encodeBase64(testBytes), b64String);
});
