```javascript
CryptPad_AsyncStore.rpc.send('ADMIN',
  ['GET_WORKER_PROFILES'],
  (e, _o) => {
    var o = _o[0];
    // console.log(o[0])
    var sorted = Object.keys(o).sort(function (a, b) {
      if (o[b] - o[a] <= 0) { return -1; }
      return 1;
    });
    var x = {};
    //console.log(sorted);
    var total = 0;
    sorted.forEach(function (k) { total += o[k]; });
    sorted.forEach(function (k) {
        console.log("[%s] %ss running time (%s%)", k, o[k], Math.floor((o[k] / total) * 100));
    });
  }
)
```


