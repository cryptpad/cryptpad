define([], function () {
    return function (n) {
        n = n || 24; // default is 24 colours
        var r = 0.6,
            i = 0,
            t = [],
            rgb = [0,2,4];

        while(i<n)t.push(i++);

        var colours = t.map(function (c, I) {
            return '#'+ rgb.map(function (j) {
                var x = ((Math.sin(r*(I+22)+j)*127+128) *0x01<<0)
                    .toString(16);
                return x.length<2?"0"+x:x;
            }).join("");
        });

        var J = 0;
        return function () {
            var j = J++;
            if (colours[j]) {
                return colours[j];
            }
            J = 0;
            return colours[0];
        };
    };
});
