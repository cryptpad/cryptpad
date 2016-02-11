define([
    '/common/Common.js'
],function (Common) { 

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
//var Common = require('./Common');

var module = module || { exports: {} };

var Operation = module.exports;

var check = Operation.check = function (op, docLength_opt) {
    Common.assert(op.type === 'Operation');
    Common.assert(Common.isUint(op.offset));
    Common.assert(Common.isUint(op.toRemove));
    Common.assert(typeof(op.toInsert) === 'string');
    Common.assert(op.toRemove > 0 || op.toInsert.length > 0);
    Common.assert(typeof(docLength_opt) !== 'number' || op.offset + op.toRemove <= docLength_opt);
};

var create = Operation.create = function (offset, toRemove, toInsert) {
    var out = {
        type: 'Operation',
        offset: offset || 0,
        toRemove: toRemove || 0,
        toInsert: toInsert || '',
    };
    if (Common.PARANOIA) { check(out); }
    return out;
};

var toObj = Operation.toObj = function (op) {
    if (Common.PARANOIA) { check(op); }
    return [op.offset,op.toRemove,op.toInsert];
};

var fromObj = Operation.fromObj = function (obj) {
    Common.assert(Array.isArray(obj) && obj.length === 3);
    return create(obj[0], obj[1], obj[2]);
};

var clone = Operation.clone = function (op) {
    return create(op.offset, op.toRemove, op.toInsert);
};

/**
 * @param op the operation to apply.
 * @param doc the content to apply the operation on 
 */
var apply = Operation.apply = function (op, doc)
{
    if (Common.PARANOIA) {
        check(op);
        Common.assert(typeof(doc) === 'string');
        Common.assert(op.offset + op.toRemove <= doc.length);
    }
    return doc.substring(0,op.offset) + op.toInsert + doc.substring(op.offset + op.toRemove);
};

var invert = Operation.invert = function (op, doc) {
    if (Common.PARANOIA) {
        check(op);
        Common.assert(typeof(doc) === 'string');
        Common.assert(op.offset + op.toRemove <= doc.length);
    }
    var rop = clone(op);
    rop.toInsert = doc.substring(op.offset, op.offset + op.toRemove);
    rop.toRemove = op.toInsert.length;
    return rop;
};

var simplify = Operation.simplify = function (op, doc) {
    if (Common.PARANOIA) {
        check(op);
        Common.assert(typeof(doc) === 'string');
        Common.assert(op.offset + op.toRemove <= doc.length);
    }
    var rop = invert(op, doc);
    op = clone(op);

    var minLen = Math.min(op.toInsert.length, rop.toInsert.length);
    var i;
    for (i = 0; i < minLen && rop.toInsert[i] === op.toInsert[i]; i++) ;
    op.offset += i;
    op.toRemove -= i;
    op.toInsert = op.toInsert.substring(i);
    rop.toInsert = rop.toInsert.substring(i);

    if (rop.toInsert.length === op.toInsert.length) {
        for (i = rop.toInsert.length-1; i >= 0 && rop.toInsert[i] === op.toInsert[i]; i--) ;
        op.toInsert = op.toInsert.substring(0, i+1);
        op.toRemove = i+1;
    }

    if (op.toRemove === 0 && op.toInsert.length === 0) { return null; }
    return op;
};

var equals = Operation.equals = function (opA, opB) {
    return (opA.toRemove === opB.toRemove
        && opA.toInsert === opB.toInsert
        && opA.offset === opB.offset);
};

var lengthChange = Operation.lengthChange = function (op)
{
    if (Common.PARANOIA) { check(op); }
    return op.toInsert.length - op.toRemove;
};

/*
 * @return the merged operation OR null if the result of the merger is a noop.
 */
var merge = Operation.merge = function (oldOpOrig, newOpOrig) {
    if (Common.PARANOIA) {
        check(newOpOrig);
        check(oldOpOrig);
    }

    var newOp = clone(newOpOrig);
    var oldOp = clone(oldOpOrig);
    var offsetDiff = newOp.offset - oldOp.offset;

    if (newOp.toRemove > 0) {
        var origOldInsert = oldOp.toInsert;
        oldOp.toInsert = (
             oldOp.toInsert.substring(0,offsetDiff)
           + oldOp.toInsert.substring(offsetDiff + newOp.toRemove)
        );
        newOp.toRemove -= (origOldInsert.length - oldOp.toInsert.length);
        if (newOp.toRemove < 0) { newOp.toRemove = 0; }

        oldOp.toRemove += newOp.toRemove;
        newOp.toRemove = 0;
    }

    if (offsetDiff < 0) {
        oldOp.offset += offsetDiff;
        oldOp.toInsert = newOp.toInsert + oldOp.toInsert;

    } else if (oldOp.toInsert.length === offsetDiff) {
        oldOp.toInsert = oldOp.toInsert + newOp.toInsert;

    } else if (oldOp.toInsert.length > offsetDiff) {
        oldOp.toInsert = (
            oldOp.toInsert.substring(0,offsetDiff)
          + newOp.toInsert
          + oldOp.toInsert.substring(offsetDiff)
        );
    } else {
        throw new Error("should never happen\n" +
                        JSON.stringify([oldOpOrig,newOpOrig], null, '  '));
    }

    if (oldOp.toInsert === '' && oldOp.toRemove === 0) {
        return null;
    }
    if (Common.PARANOIA) { check(oldOp); }

    return oldOp;
};

/**
 * If the new operation deletes what the old op inserted or inserts content in the middle of
 * the old op's content or if they abbut one another, they should be merged.
 */
var shouldMerge = Operation.shouldMerge = function (oldOp, newOp) {
    if (Common.PARANOIA) {
        check(oldOp);
        check(newOp);
    }
    if (newOp.offset < oldOp.offset) {
        return (oldOp.offset <= (newOp.offset + newOp.toRemove));
    } else {
        return (newOp.offset <= (oldOp.offset + oldOp.toInsert.length));
    }
};

/**
 * Rebase newOp against oldOp.
 *
 * @param oldOp the eariler operation to have happened.
 * @param newOp the later operation to have happened (in time).
 * @return either the untouched newOp if it need not be rebased,
 *                the rebased clone of newOp if it needs rebasing, or
 *                null if newOp and oldOp must be merged.
 */
var rebase = Operation.rebase = function (oldOp, newOp) {
    if (Common.PARANOIA) {
        check(oldOp);
        check(newOp);
    }
    if (newOp.offset < oldOp.offset) { return newOp; }
    newOp = clone(newOp);
    newOp.offset += oldOp.toRemove;
    newOp.offset -= oldOp.toInsert.length;
    return newOp;
};

/**
 * this is a lossy and dirty algorithm, everything else is nice but transformation
 * has to be lossy because both operations have the same base and they diverge.
 * This could be made nicer and/or tailored to a specific data type.
 *
 * @param toTransform the operation which is converted *MUTATED*.
 * @param transformBy an existing operation which also has the same base.
 * @return toTransform *or* null if the result is a no-op.
 */
var transform0 = Operation.transform0 = function (text, toTransform, transformBy) {
    if (toTransform.offset > transformBy.offset) {
        if (toTransform.offset > transformBy.offset + transformBy.toRemove) {
            // simple rebase
            toTransform.offset -= transformBy.toRemove;
            toTransform.offset += transformBy.toInsert.length;
            return toTransform;
        }
        // goto the end, anything you deleted that they also deleted should be skipped.
        var newOffset = transformBy.offset + transformBy.toInsert.length;
        toTransform.toRemove = 0; //-= (newOffset - toTransform.offset);
        if (toTransform.toRemove < 0) { toTransform.toRemove = 0; }
        toTransform.offset = newOffset;
        if (toTransform.toInsert.length === 0 && toTransform.toRemove === 0) {
            return null;
        }
        return toTransform;
    }
    if (toTransform.offset + toTransform.toRemove < transformBy.offset) {
        return toTransform;
    }
    toTransform.toRemove = transformBy.offset - toTransform.offset;
    if (toTransform.toInsert.length === 0 && toTransform.toRemove === 0) {
        return null;
    }
    return toTransform;
};

/**
 * @param toTransform the operation which is converted
 * @param transformBy an existing operation which also has the same base.
 * @return a modified clone of toTransform *or* toTransform itself if no change was made.
 */
var transform = Operation.transform = function (text, toTransform, transformBy, transformFunction) {
    if (Common.PARANOIA) {
        check(toTransform);
        check(transformBy);
    }
    transformFunction = transformFunction || transform0;
    toTransform = clone(toTransform);
    var result = transformFunction(text, toTransform, transformBy);
    if (Common.PARANOIA && result) { check(result); }
    return result;
};

/** Used for testing. */
var random = Operation.random = function (docLength) {
    Common.assert(Common.isUint(docLength));
    var offset = Math.floor(Math.random() * 100000000 % docLength) || 0;
    var toRemove = Math.floor(Math.random() * 100000000 % (docLength - offset)) || 0;
    var toInsert = '';
    do {
        var toInsert = Common.randomASCII(Math.floor(Math.random() * 20));
    } while (toRemove === 0 && toInsert === '');
    return create(offset, toRemove, toInsert);
};

    return module.exports;
});
