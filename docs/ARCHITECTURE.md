So you want to write a realtime collaborative application?

This guide will focus on applications which require **multiple clients** to **collaboratively construct a single authoratative document**.

[XWiki-Labs](https://labs.xwiki.com/) has published an open source suite (called [Cryptpad](https://github.com/xwiki-labs/cryptpad)) of collaborative editors  which employ end to end encryption.
This guide will refer to the techniques used in the prototypes developed therein.

Let's start with an overview of the components involved.

## Consensus

The difficulty in writing a _realtime application_ is in reconciling the fact that it is impossible for two events separated by some distance to interact instantaneously.

Such an application will require clients to agree on a protocol by which they can resolve disputes such that upon receiving each others' messages they are able to construct the same document.

Suppose Alice and Bob are working on the same text document at the same time.
They each begin with a document in an agreed upon state, which will be referred to as **O**.

Alice makes a change **a** to **O**, while Bob makes a change **b** to to **O**.

What do they do next?

1. They each review their documents before and after their revisions and determine what has changed, this is called a **diff**
2. They formulate these changes into a form which encapsulates the minimum amount of information required to update a previously agreed upon document to their current state. This is called a **patch*
3. They serialize their patch into a form which can be transferred across whatever medium they are using to communicate. This is called a **message**

In order to produce the same document while having received each others messages in different orders, they must use an algorithm known as [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation).

The short explanation is that when messages are received out of order, the client must determine two things:

1. What state was the document in when the conflicting edit was made? If the two events are a part of a timeline which has diverged, what is their common ancestor? This can be thought of as **O[n]**
2. If both operations **a** and **b** were intended to transform **O[n]** to **O[n+1]**, how can **a** be transformed such that it modifies **O[n]** after **b**, taking into account **b**'s effect.

If two operations are capable of being resolved, then one of them effectively becomes **O[n+1]**, while the other becomes **O[n+2]**.
For the purposes of the document, it doesn't matter which becomes which, it must be possible for either transformation to be valid.

The research team at XWiki Labs created and continues to maintain a Javascript library called [Chainpad](https://github.com/xwiki-contrib/chainpad "Realtime Collaborative Editor Algorithm based on Nakamoto Blockchains") which simplifies this process, and provides a few guarantees about how differences will be resolved.

The algorithm is based on Nakamoto Blockchains, a construct popularized by Bitcoin, and now a growing number of other cryptocurrencies.
The core datatype is considered a [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type "Conflict-free Replicated Data Type).
CRDTs are also also employed by the popular source control managements software [Git](https://en.wikipedia.org/wiki/Git_%28software%29).

Each patch references the [SHA-256 Hash](https://en.wikipedia.org/wiki/Secure_Hash_Algorithm "Secure Hashing Algorithms") of the previous state of the document.
The availability of these hashes make it possible for clients to independently verify the authenticity of a patch, and validate that a patch can successfully be applied to a document at a particular point within its history.
Patches which are determined to be invalid are rejected.

At present, Chainpad can only be used for determining consensus on text documents.
Its patches consist of **Operations** which consist of:

1. an offset from the start of the document where changes are to be applied
2. a number of characters to remove
3. a string of characters to insert

This means that the list of possible operations is very small, which is important as a matrix of transformations is a square.

As an author of a particular application, it is your responsibility to use Chainpad correctly.
You provide the diffing, patching logic, and interface rendering logic, and Chainpad will provide an API for retrieving the agreed upon document from the blockchain.

A particularly useful property of Chainpad's algorithm is that consensus can be reached without requiring a central authority.
Since clients alone can determine what they agree on, whatever services are responsible for delivering and storing messages can be ignorant of the content of their messages.

This means that using chainpad, clients can collaborate in realtime while using end to end encryption, provided each client has a pre-shared key.

## Datastore

While it's possible for messages to propogate using a [gossip protocol](https://en.wikipedia.org/wiki/Gossip_protocol) and therefore not rely on havinga centralized service for storing messages, it's possible for the members of a gossip network to [Netsplit](https://en.wikipedia.org/wiki/Netsplit).
Chainpad currently has no mechanism for resolving such an event.

If a member of a session disconnects (as defined by not responding to a ping with a pong in a specified timeframe) any revisions that they make to their version of a document will be ignored.
When all connected members of a document have received and integrated a patch into their document, that patch can be considered to be a part of the **Authoratative Document**.

The simplest way to guarantee that all clients within a session have the same document is to require that they all retrieve their messages from a single entity which is responsible for compiling a history of messages which are received in a particular order, and for distributing those messages in the same order.

Chainpad can handle out of order messages, but it performs best when its messages are delivered in the order of their hash references.

By architecting your system such that all clients send to a server which then relays to other clients, you guarantee that a particular chain of patches is consistent between the participants of your session.

Cryptpad is capable of using a variety of data stores.
Which data store your instance employs can be [easily configured](https://github.com/xwiki-labs/cryptpad/blob/master/config.example.js).

You simply need to write an adaptor which conforms to a simple API.
The documentation for writing such an adaptor, and the complete list of implemented adaptors, is available [here](https://github.com/xwiki-labs/cryptpad/tree/master/storage).

Whether you decide to use a single server, or distribute messages across a network of entities, the body which stores the **Authoratative Document** will be referred to as the **History Keeper** for the purposes of this guide.

## Transport

Cryptpad was initially written to use [websockets](https://en.wikipedia.org/wiki/WebSocket) for transportation of messages.

Since a relay server is indispensable in this model, that server doubles as the **History Keeper**, and implements a datastore.

Provided Chainpad's requirements are fulfilled, however, there are alternative models that we can employ.

1. we must inform the realtime session whether a client is still in the session for the purposes of determining the **Authoratative Document**
2. we must guarantee that any client can retrieve the complete history of the chain at any given time
3. we must guarantee that a client has knowledge of the **Authoratative Document** before we attempt to process any of their messages

[Netflux](https://github.com/xwiki-labs/netflux "JavaScript client side API based on WebRTC & WebSocket") is an API which is being developed as a part of the [OpenPaaS::ng Project](http://ng.open-paas.org/).
It provides an abstraction over transportation details, and ensures that the above requirements can be met.

It provides a notion of **WebChannels**, to which a client can send a message.
The API guarantees that the client's message will be delivered to all members of that channel, and that they will receive an acknowledge that their message has been distributed.

This high level API can be implemented using Websockets, [WebRTC](https://webrtc.org/), and any new transport capable of providing the same guarantees.
This is, of course, not limited to functioning in the context of the web.

We are able to abstract away the actual topology of the network such that it can accommodate multiple servers.

Aside from providing a generic interface for connecting with other clients, the Netflux API allows for any member of the session to act as the **History Keeper**.
We explored this methodology by implementing another Realtime CKEditor prototype which communicates over WebRTC and places the burden of storing messages on one of the participating clients (typically the first to join the session).

## Interface

The interface which your application will expose to its users can vary widely.
Different interfaces are likely to present different difficulties.
Nevertheless, there are several themes which are common to many applications.

### Cursor Correction

If an interface is interactive, which they typically are, then the user will likely be able to select a particular area.

If the interface is a plain text editor, maintaining the location of the cursor while updating the contents of the editor is not especially difficult.
The process involves checking where the user's selection is located (possibly a start and end), determining whether the changes to the document occurred before or after those points, and updating the selection boundaries if necessary.

If the interface is a WYSIWYG editor, maintaining the location of the cursor is more difficult, as the number of characters changed in the authoratative document does not correspond directly to the number of characters which the user perceives.
It is the application developers' responsibility to infer from the new content where the cursor should be, and to render the modified content in such a way that it does not disrupt user experience.
In the process of developing its [Realtime CKEditor](https://cryptpad.fr) XWiki Labs discovered that many of the [existing Javascript libraries](https://github.com/Matt-Esch/virtual-dom) for updating a **DOM** are very destructive, and replace elements completely once a difference is detected within the tree (when scanning left to right).

After testing several options, we ended up using a patched version of [**DiffDOM**](https://github.com/fiduswriter/diffDOM).
Its diffing algorithm is _mostly correct_, but it lacks a move operation, namely, it determine that when the text of a paragraph gets bolded, that the textNode within the P should be moved into a STRONG element, with that STRONG element placed within the P.
As such, there are difficulties with applying styles to large portions of the document while someone is editing within that section.

On the whole, however, contentEditable documents avoid many of the problems that a text editor faces with its rendering cycle.
DOM selections consist of a start and an end, which themselves consist of a reference to an element and an offset within that element.
Provided you can avoid redrawing DOM elements unnecessarily, unless a modification to the DOM directly affects an element, the cursor will not be affected.

### Canonicalization

Not all browsers represent the content of an interface the same way.
Typically this isn't an issue, as a browser only has to work with data that it generated itself.

When you try to synchronize data between two clients, they can fall into cycles where each client repeatedly tries to force another browser to accept its own representation.
Some browsers will accept certain changes, even though they wouldn't generate those representations themselves.
Some browsers will immediately correct the representation and fall into an endless loop which is only limited in speed by the fact that it has to travel over the network for each iteration.

![Browser Wars](http://media02.hongkiat.com/battle-of-browsers-artworks/browser-wars.jpg)

In the case of a text editor which uses a textarea element for a user interface, some browsers represent line breaks with `\n`, while other use `\r\n`.
This is easy to fix, since all browsers seem to tolerate the `\r` being stripped.
We can **canonicalize** the content, or put it into [Canonical Form](https://en.wikipedia.org/wiki/Canonical_form).

This is probably the most unpredictable part of developing a realtime application, as you won't notice how a browser changes content until you try it in a realtime session.
The easiest way to handle this is to limit the type of clients you support.
Since we can only support editors which support our transport system, we eliminate any browser that doesn't support Websockets.
Most modern browsers are fairly simple.

For our contentEditable realtime app (with CKEditor), we decided to use an intermediary representation of the DOM rather than trying to synchronize the outerHTML of the document.
We created a representation that we called **[HyperJSON](https://github.com/xwiki-labs/hyperjson)**.
HyperJSON can be created from any DOM element, and is easily serializable since it is a subset of JSON.
HyperJSON specifies the complete structure of the DOM, including attributes that elements may have.

Our HyperJSON module also provides a function which recursively applies a callback to HyperJSON, and returns the result.
Our function was inspired by [**dom2hscript**](https://github.com/AkeemMcLennon/dom2hscript), which transforms a DOM into the equivalent [**Hyperscript**](https://github.com/dominictarr/hyperscript).
Our `Hyperjson.callOn` function accepts **Hyperscript** as a second argument, and uses its functionality to transform our serialized DOM back into an actual DOM element.

Locally, if a client attempts to update their interface, they will serialize their content into a string form to be inserted into Chainpad.
If a string comparison does not return `true`, then it will perform a diff and send its changes over the wire.
The problem with this when serializing a DOM is that an element which possesses attributes can be serialized in several ways.

Consider the HTML snippet: `<p style="border: 1px solid white; color:red;">pewpew</p>`.
When converted into HyperJSON, it will consist of a string identifying the type of element, the attributes of that node in a map, and a list of the element's child elements.

The problem here is that maps have undefined behaviour with regard to the ordering of their keys.
Thus, the map of style attributes can serialize as either `{"border":"1px solid white","color":"red"}` or `{"color":"red","border":"1px solid white"}`.
This is easily solved by sorting the attributes into a deterministic order.

We used [JSON.sortify](https://github.com/ThomasR/JSON.sortify) to define a canonical form when serializing our HyperJSON.
Since everything else but the maps in the HyperJSON structure is already deterministic, this provides a simple way to prevent one cause of browser fights.

### filtering local elements

Depending on your interface, you may find that there are other elements or attributes which may only have a valid meaning in certain environments.
We have encountered [Bogus BRs](https://bugzilla.mozilla.org/show_bug.cgi?id=911201), which some browsers insert for the purpose of making empty P tags selectable in contentEditable elements.
In Firefox, these manifest as `<BR type="_moz"/>`.
Some browsers will drop this attribute, resulting in bad merges, or cycles of modifications to the DOM.

Other times, the problem isn't in a browser's internal representation, but in the fact that some additional feature of your application functions by modifying the content itself.
We found that this was the case with CKEditor's [MagicLine Plugin](http://docs.ckeditor.com/#!/guide/dev_magicline), which inserts SPAN elements into the DOM to expose a clickable surface to the user.

To deal with this issue, we implemented functionality for ignoring elements and modifying the output of our HyperJSON serializer while recursing over the DOM.
Depending on your use case, you may have to implement your own serializer.

We found that having the capacity to filter elements using optional functions supplied at runtime was a very flexible system.
Since our goal at XWiki labs is to research new technology as well as provide tools for improving [our company's core product](http://www.xwiki.org/xwiki/bin/view/Main/WebHome), we wanted a technique that could easily be extended to suit our diverse userbase's requirements.

## Encryption

Of all the components explained in this document, encryption is the only optional technique when building a realtime collaborative editor.
As mentioned above, it's an option you can freely exploit when using chainpad, since your datastore and transport system do not require any knowledge of your document's content.

That isn't to say that there are no tradeoffs when keeping that information from your server, indeed, there are several challenges.

### Our Encryption Scheme

The encryption scheme employed by Cryptpad is a [symmetric encryption](https://en.wikipedia.org/wiki/Symmetric-key_algorithm) which utilizes a single [pre-shared-key](https://en.wikipedia.org/wiki/Pre-shared_key) known by all participants.

Encryption is complex, and poorly understood by the majority of those who use it on a daily basis.
Pre-shared-keys are among the weakest possible cryptographic tools available today, however, few if any other encryption schemes scale to any number of users.

For our purposes, we would like our application to offerthe benefits of encryption without being any more difficult to use.
Since the method of collaborating on any web resource typically involves sharing the URL, we use the hash of the URl to share the pre-shared-key.
Anything in a URL which follows a `#` is not sent to the server, meaning that our web app will store your users' messages without ever knowing their content.

Any users who would like to rely on the properties of this scheme should understand that anyone who can read their URL can access the same document.
For this reason, a document's contents are only as secure as the method used to share the URL.

### How Encryption limits our application

It's important to understand that encryption is not a great cause of difficulty, rather, once encryption is involved it can generally be assumed that users will expect their content to be treated as sensitive.
This rules out many features which assume that a **History Keeper** can intervene in the session.

#### Limitations

It is possible for a client to send junk patches.
These patches should be rejected by the other clients, however, since the **History Keeper** does not know what the contents of the messages are, they cannot choose to reject bogus patches.
As a result, these patches are irrevocably added to the document's chain.
Whenever a client joins Realtime Collaborative session, they must download the full history of the session before participating.
This means that malicious client can fill a channel with junk messages with no repercussions.

This long sync time is a factor even if none of the clients can be considered **Bad Actors**, a session need only have a large number of patches.
This is particularly troublesome for clients using devices which have difficulty _syncing the chain_, as well as those which lose their connections frequently.
We do not yet have an implementation which allows clients to avoid resyncing documents which they have previously edited, though we could exploit the [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

We have built realtime editors for use cases which preclude the use of encryption, notably within XWiki.
Since the purpose of the platform is to share information, preventing the document from being read directly from the server would be counterproductive.

For this purpose, we have employed a scheme wherein the first user in a realtime session fetches the latest state of a document from the server in a complete form.
Additional users must sync the chain of messages in order to participate, however, they are still able to save in the manner native to XWiki.

When the final user leaves the realtime collaborative session, the history is deleted, and the same process is started over the next time a user attempts to edit using the realtime functionality.

A session could still have difficulty with very large chains, however, in practice sessions rarely last long enough for it to become a noticeable problem.


## Conclusion
