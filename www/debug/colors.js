define(function () {
    var padZero = function (str, len) {
        len = len || 2;
        var zeros = new Array(len).join('0');
        return (zeros + str).slice(-len);
    };
    var invertColor = function (hex) {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            console.error(hex);
            throw new Error('Invalid HEX color.');
        }
        // invert color components
        var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
            g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
            b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
        // pad each with zeros and return
        return '#' + padZero(r) + padZero(g) + padZero(b);
    };
    var rgb2hex = function (rgb) {
        if (rgb.indexOf('#') === 0) { return rgb; }
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        var hex = function (x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        };
        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    };
    var hex2rgba = function (hex, opacity) {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (!opacity) { opacity = 1; }
        var r = parseInt(hex.slice(0,2), 16);
        var g = parseInt(hex.slice(2,4), 16);
        var b = parseInt(hex.slice(4,6), 16);
        return 'rgba('+r+', '+g+', '+b+', '+opacity+')';
    };
    return {
        invert: invertColor,
        rgb2hex: rgb2hex,
        hex2rgba: hex2rgba
    };
});
