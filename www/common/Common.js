define([], function () {
    var module = module || { exports: {} };

/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var PARANOIA = module.exports.PARANOIA = false;

/* throw errors over non-compliant messages which would otherwise be treated as invalid */
var TESTING = module.exports.TESTING = true;

var assert = module.exports.assert = function (expr) {
    if (!expr) { throw new Error("Failed assertion"); }
};

var isUint = module.exports.isUint = function (integer) {
    return (typeof(integer) === 'number') &&
        (Math.floor(integer) === integer) &&
        (integer >= 0);
};

var randomASCII = module.exports.randomASCII = function (length) {
    var content = [];
    for (var i = 0; i < length; i++) {
        content[i] = String.fromCharCode( Math.floor(Math.random()*256) % 57 + 65 );
    }
    return content.join('');
};

var strcmp = module.exports.strcmp = function (a, b) {
    if (PARANOIA && typeof(a) !== 'string') { throw new Error(); }
    if (PARANOIA && typeof(b) !== 'string') { throw new Error(); }
    return ( (a === b) ? 0 : ( (a > b) ? 1 : -1 ) );
}

    return module.exports;
});
