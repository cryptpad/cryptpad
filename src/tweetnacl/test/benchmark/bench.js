var nacl = (typeof window !== 'undefined') ? window.nacl : require('../../' + (process.env.NACL_SRC || 'nacl.min.js'));
var helpers = (typeof require !== 'undefined') ? require('./helpers') : window.helpers;
var log = helpers.log;

if (!nacl) throw new Error('nacl not loaded');

function benchmark(fn, bytes, num) {
  if (!num) num = 1000;
  var i, elapsed, start = new Date();
  while (1) {
    for (i = 0; i < num; i++) fn();
    elapsed = (new Date()) - start;
    if (elapsed < 500) {
      num += num*1000/elapsed/2;
    } else {
      break;
    }
  }

  log.print(' ' + ((bytes*num/1024/1024*1000)/elapsed).toFixed(3), 'MB/s');
  log.print(' ' + ((num*1000)/elapsed).toFixed(3), 'ops/s');
}

function benchmarkOps(fn,  num) {
  var i, elapsed, start = new Date();
  while (1) {
    for (i = 0; i < num; i++) {
      fn();
    }
    elapsed = (new Date()) - start;
    if (elapsed < 500) {
      num += num*1000/elapsed/2;
    } else {
      break;
    }
  }
  log.print(' ' + ((num*1000)/elapsed).toFixed(3), 'ops/s');
}

function crypto_stream_xor_benchmark() {
  log.start('Benchmarking crypto_stream_xor');
  var m = new Uint8Array(1024),
      n = new Uint8Array(24),
      k = new Uint8Array(32),
      out = new Uint8Array(1024);
  for (i = 0; i < 1024; i++) m[i] = i & 255;
  for (i = 0; i < 24; i++) n[i] = i;
  for (i = 0; i < 32; i++) k[i] = i;
  benchmark(function(){
    nacl.lowlevel.crypto_stream_xor(out, 0, m, 0, m.length, n, k);
  }, m.length);
}

function crypto_onetimeauth_benchmark() {
  log.start('Benchmarking crypto_onetimeauth');
  var m = new Uint8Array(1024),
      out = new Uint8Array(1024),
      k = new Uint8Array([0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1,2,3,4,5,6,7,8,9,0,1]);
  for (i = 0; i < 1024; i++) {
    m[i] = i & 255;
  }
  benchmark(function(){
    nacl.lowlevel.crypto_onetimeauth(out, 0, m, 0, m.length, k);
  }, m.length);
}

function crypto_secretbox_benchmark() {
  log.start('Benchmarking crypto_secretbox');
  var i, k = new Uint8Array(32), n = new Uint8Array(24),
      m = new Uint8Array(1024), c = new Uint8Array(1024);
  for (i = 0; i < 32; i++) k[i] = 1;
  for (i = 0; i < 24; i++) n[i] = 2;
  for (i = 0; i < 1024; i++) m[i] = 3;
  benchmark(function() {
    nacl.lowlevel.crypto_secretbox(c, m, m.length, n, k);
  }, m.length);
}

function secretbox_seal_open_benchmark() {
  var key = new Uint8Array(32),
      nonce = new Uint8Array(24),
      msg = new Uint8Array(1024),
      box, i;
  for (i = 0; i < 32; i++) key[i] = 1;
  for (i = 0; i < 24; i++) nonce[i] = 2;
  for (i = 0; i < 1024; i++) msg[i] = 3;

  log.start('Benchmarking secretbox');
  benchmark(function() {
    box = nacl.secretbox(msg, nonce, key);
  }, msg.length);
  log.start('Benchmarking secretbox.open');
  benchmark(function() {
    nacl.secretbox.open(box, nonce, key);
  }, msg.length);
}

function crypto_scalarmult_base_benchmark() {
  log.start('Benchmarking crypto_scalarmult_base');
  var n = new Uint8Array(32), q = new Uint8Array(32);
  for (var i = 0; i < 32; i++) n[i] = i;
  benchmarkOps(function() {
    nacl.lowlevel.crypto_scalarmult_base(q, n);
  }, 10);
}

function box_seal_open_benchmark() {
  var pk1 = new Uint8Array(32), sk1 = new Uint8Array(32),
      pk2 = new Uint8Array(32), sk2 = new Uint8Array(32);
  nacl.lowlevel.crypto_box_keypair(pk1, sk1);
  nacl.lowlevel.crypto_box_keypair(pk2, sk2);
  var nonce = nacl.util.decodeUTF8('123456789012345678901234');
  var msg = nacl.util.decodeUTF8((new Array(1024)).join('a'));
  var box = null;
  log.start('Benchmarking box');
  benchmark(function() {
    box = nacl.box(msg, nonce, pk1, sk2);
  }, msg.length, 20);
  log.start('Benchmarking box.open');
  benchmark(function() {
    nacl.box.open(box, nonce, pk2, sk1);
  }, msg.length, 20);
}

function sign_open_benchmark() {
  var k = nacl.sign.keyPair();
  var sk = k.secretKey;
  var pk = k.publicKey;
  var msg = nacl.util.decodeUTF8((new Array(128)).join('a'));
  var sm;
  log.start('Benchmarking sign');
  benchmark(function() {
    sm = nacl.sign(msg, sk);
  }, msg.length, 20);
  log.start('Benchmarking sign.open');
  benchmark(function() {
    nacl.sign.open(sm, pk);
  }, msg.length, 20);
}

function crypto_hash_benchmark() {
  log.start('Benchmarking crypto_hash (1024 bytes)');
  var m = new Uint8Array(1024), out = new Uint8Array(64);
  for (i = 0; i < m.length; i++) m[i] = i & 255;
  benchmark(function(){
    nacl.lowlevel.crypto_hash(out, m, m.length);
  }, m.length);

  log.start('Benchmarking crypto_hash (16 KiB)');
  m = new Uint8Array(16*1024);
  for (i = 0; i < m.length; i++) m[i] = i & 255;
  benchmark(function(){
    nacl.lowlevel.crypto_hash(out, m, m.length);
  }, m.length);
}

crypto_stream_xor_benchmark();
crypto_onetimeauth_benchmark();
crypto_secretbox_benchmark();
crypto_hash_benchmark();
secretbox_seal_open_benchmark();
crypto_scalarmult_base_benchmark();
box_seal_open_benchmark();
sign_open_benchmark();
