var nacl = (typeof window !== 'undefined') ? window.nacl : require('../' + (process.env.NACL_SRC || 'nacl.min.js'));
var test = require('tape');

var enc = nacl.util.encodeBase64,
    dec = nacl.util.decodeBase64;

test('nacl.sign.keyPair', function(t) {
  var keys = nacl.sign.keyPair();
  t.ok(keys.secretKey && keys.secretKey.length === nacl.sign.secretKeyLength, 'has secret key');
  t.ok(keys.publicKey && keys.publicKey.length === nacl.sign.publicKeyLength, 'has public key');
  t.notEqual(enc(keys.secretKey), enc(keys.publicKey));
  var newKeys = nacl.sign.keyPair();
  t.notEqual(enc(newKeys.secretKey), enc(keys.secretKey), 'two keys differ');
  t.end();
});

test('nacl.sign.keyPair.fromSecretKey', function(t) {
  var k1 = nacl.sign.keyPair();
  var k2 = nacl.sign.keyPair.fromSecretKey(k1.secretKey);
  t.equal(enc(k2.secretKey), enc(k1.secretKey));
  t.equal(enc(k2.publicKey), enc(k1.publicKey));
  t.end();
});

test('nacl.sign.keyPair.fromSeed', function(t) {
  var seed = nacl.randomBytes(nacl.sign.seedLength);
  var k1 = nacl.sign.keyPair.fromSeed(seed);
  var k2 = nacl.sign.keyPair.fromSeed(seed);
  t.equal(k1.secretKey.length, nacl.sign.secretKeyLength);
  t.equal(k1.publicKey.length, nacl.sign.publicKeyLength);
  t.equal(k2.secretKey.length, nacl.sign.secretKeyLength);
  t.equal(k2.publicKey.length, nacl.sign.publicKeyLength);
  t.equal(enc(k2.secretKey), enc(k1.secretKey));
  t.equal(enc(k2.publicKey), enc(k1.publicKey));
  var seed2 = nacl.randomBytes(nacl.sign.seedLength);
  var k3 = nacl.sign.keyPair.fromSeed(seed2);
  t.equal(k3.secretKey.length, nacl.sign.secretKeyLength);
  t.equal(k3.publicKey.length, nacl.sign.publicKeyLength);
  t.notEqual(enc(k3.secretKey), enc(k1.secretKey));
  t.notEqual(enc(k3.publicKey), enc(k1.publicKey));
  t.throws(function() { nacl.sign.keyPair.fromSeed(seed2.subarray(0, 16)) }, Error, 'should throw error for wrong seed size');
  t.end();
});

test('nacl.sign and nacl.sign.open', function(t) {
  var k = nacl.sign.keyPair();
  var m = new Uint8Array(100);
  for (var i = 0; i < m.length; i++) m[i] = i & 0xff;
  var sm = nacl.sign(m, k.secretKey);
  t.ok(sm.length > m.length, 'signed message length should be greater than message length');
  var om = nacl.sign.open(sm, k.publicKey);
  t.deepEqual(om, m);
  t.throws(function() { nacl.sign.open(sm, k.publicKey.subarray(1)) }, Error, 'throws error for wrong public key size');
  var badPublicKey = new Uint8Array(k.publicKey.length);
  om = nacl.sign.open(sm, badPublicKey);
  t.equal(om, null, 'opened message must be null when using wrong public key');
  for (i = 80; i < 90; i++) sm[i] = 0;
  om = nacl.sign.open(sm, k.publicKey);
  t.equal(om, null, 'opened message must be null when opening bad signed message');
  t.end();
});

test('nacl.sign.detached and nacl.sign.detached.verify', function(t) {
  var k = nacl.sign.keyPair();
  var m = new Uint8Array(100);
  for (var i = 0; i < m.length; i++) m[i] = i & 0xff;
  var sig = nacl.sign.detached(m, k.secretKey);
  t.ok(sig.length === nacl.sign.signatureLength, 'signature must have correct length');
  var result = nacl.sign.detached.verify(m, sig, k.publicKey);
  t.ok(result, 'signature must be verified');
  t.throws(function() { nacl.sign.detached.verify(m, sig, k.publicKey.subarray(1)) }, Error, 'throws error for wrong public key size');
  t.throws(function() { nacl.sign.detached.verify(m, sig.subarray(1), k.publicKey) }, Error, 'throws error for wrong signature size');
  var badPublicKey = new Uint8Array(k.publicKey.length);
  result = nacl.sign.detached.verify(m, sig, badPublicKey);
  t.equal(result, false, 'signature must not be verified with wrong public key');
  for (i = 0; i < 10; i++) sig[i] = 0;
  result = nacl.sign.detached.verify(m, sig, k.publicKey);
  t.equal(result, false, 'bad signature must not be verified');
  t.end();
});
