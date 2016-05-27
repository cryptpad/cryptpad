# Realtime Lists and Maps

Our realtime list/map API has some limitations.

## Datatype Serialization

Only datatypes which can be serialized via `JSON.parse(JSON.stringify(yourObject))` will be preserved.

This means the following types can be serialized:

1. strings
2. objects
3. arrays
4. booleans
5. numbers
6. null

While these cannot be serialized:

1. undefined
2. symbol

## Object Interaction

Only 'get' and 'set' methods are supported.
This is because we need to limit the operations we support to those supported by all browsers we might use.

Currently that means we can't rely on `in`, `delete`, or anything other than a `get`/`set` operation to behave as expected.
Treat all other features as `Undefined Behaviour`.

> Your mileage may vary

`set` methods include all of the [assignment operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment_Operators#Exponentiation_assignment).

```
// where 'x' is the realtime object `{}`

// assignment
x.n = 5;

x.n += 3;
x.n++;
++x.n;

x.a = 5;
x.b = 3;
x.a *= x.b++;
x // {a: 15, b: 4, n: 10}
```

Instead of `delete`, assign `undefined`.
`delete` will remove an attribute locally, but the deletion will not propogate to other clients until your next serialization.
This is potentially problematic, as it can result in poorly formed patches.

### Object and array methods

methods which do not directly use setters and getters can be problematic:

`Array.push` behaves correctly, however, `Array.pop` does not.


## Deep Equality

Normally in Javascript objects are passed by reference.
That means you can do things like this:

```
var a = {x: 5};
var b = a;

// true
console.log(a === b);
```

Using the realtime list/map API, objects are serialized, and are therefore copied by value.

Since objects are deserialized and created on each client, you will not be able to rely on this kind of equality across objects, despite their having been created in this fashion.

Object equality _might_ work if the comparison is performed on the same client that initially created the object, but relying on this kind of behaviour is not advisable.

## Listeners

You can add a listener to an attribute (via its path relative to the root realtime object).

There are various types of listeners

* change
* remove
* disconnect
* ready

### Semantics

Suppose you have a realtime object `A` containing nested structures.

```
{
    a: {
        b: {
            c: 5
        }
    },
    d: {
        e: [
            1,
            4,
            9
        ]
    }
}
```

If you want to be alerted whenever the second element in the array `e` within `d` changes, you can attach a listener like so:

```
A.on('change', ['d', 'e', 1], function (oldval, newval, path, rootObject) {
    /* do something with these values */
    console.log("value changes from %s to %s", oldval, newval);
});
```

## Known Bugs

there is currently an issue with popping the last element of an array.

