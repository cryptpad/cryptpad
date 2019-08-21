// remove duplicate elements in an array
module.exports = function (O) {
    // make a copy of the original array
    var A = O.slice();
    for (var i = 0; i < A.length; i++) {
        for (var j = i + 1; j < A.length; j++) {
            if (A[i] === A[j]) { A.splice(j--, 1); }
        }
    }
    return A;
};
