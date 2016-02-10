# This is Cryptpad

There are quite a few realtime editors packed into this installation.
Most are prototypes that could use a lot of work.

All editors make use of Cryptpad's end to end encryption.
Some of them have much better UI.

## /pad/

Pad is the main feature of Cryptpad. It features a CKEditor for realtime WYSIWYG editing.

## /code/

Code has syntax highlighting features.

## /sheet/

Sheet is under development. It will feature realtime collaborative spreadsheets.

## /text/

Text is a very simple encrypted plain text editor with no highlighting.

## /render/

Render takes advantage of the fact that multiple editors can both use the same 'channel' at once.
Channel, in this sense, refers to part of the unique hash of a page which groups messages together.
If you visit a /text/ and a /render/ page simultaneously, the changes you make in /text/ will be 
rendered as markdown in /render/. You can't edit in /render/ directly, but it adds value to other
editors by allowing a realtime preview of your work.

## /vdom/

Vdom is under heavy development, and features an alternative approach to the realtime WYSIWYG
editor. It syncs a representation of a virtual-dom instead of syncing the HTML itself. In practice,
this means that there are fewer inconsistencies between different browsers' representations of the dom.
This makes the codebase much simpler, and eliminates many classes of bugs. It's still far from perfect,
but it is quite promising.

## /hack/

Hack leaves it to the user to decide whether XSS (Cross site scripting) is a bug or a feature.
It exposes a realtime text pad to multiple users, and provides a button which will cause the
contents of the pad to be passed to an `eval` call. Anyone with the hash of the page can edit
the contents, so make sure you read the code you're about to run. If you can't read it, you
probably shouldn't run it. In any case, it might be useful for pair programming or when you want
to sketch out and prototype simple demos.

## Coming soon

* style
  - live editing of CSS as applied to some Lorum Ipsum
* polyweb
  - a multi-featured editor which connects to multiple channels at once, for:
    1. live rendered markdown
    2. live style editing
    3. live javascript
