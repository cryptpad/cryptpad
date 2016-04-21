# Storage Mechanisms

Cryptpad's message API is quite simple and modular, and it isn't especially difficult to write alternative modules that employ your favourite datastore.

There are a few guidelines for creating a module:

Dependencies for your storage engine **should not** be added to Cryptpad.
Instead, write an adaptor, and place it in `cryptpad/storage/yourAdaptor.js`.

## Your adaptor should conform to a simple API.

It must export an object with a single property, `create`, which is a function.
That function must accept two arguments:

1. an object containing configuration values
  - any configuration values that you require should be well documented
  - they should also be named carefully so as to avoid collisions with other modules
2. a callback
  - this callback is used to return an object with (currently) two methods
  - even if your storage mechanism can be executed synchronously, we use the callback pattern for portability.

## Methods

### message(channelName, content, handler)

When Cryptpad receives a message, it saves it into its datastore using its equivalent of a table for its channel name, and then relays the message to every other client which is participating in the same channel.

Relaying logic exists outside of the storage module, you simply need to store the message then execute the handler on success.

### getMessages(channelName, handler, callback)

When a new client joins, they request the entire history of messages for a particular channel.
This method retreives those messages, and delivers them in order.

In practice, out of order messages make your clientside application more likely to fail, however, they are generally tolerated.
As a channel accumulates a greater number of messages, the likelihood of the application receiving them in the wrong order becomes greater.
This results in older sessions becoming less reliable.

This function accepts the name of the channel in which the user is interested, the handler for each message, and the callback to be executed when the last message has been fetched and handled.

**Note**, the callback is a new addition to this API.
It is only implemented within the leveldb adaptor, making our latest code incompatible with the other back ends.
While we migrate to our new Netflux API, only the leveldb adaptor will be supported.

## Documenting your adaptor

Naturally, you should comment your code well before making a PR.
Failing that, you should definitely add notes to `cryptpad/config.js.dist` such that people who wish to install your adaptor know how to do so.

Notes on how to install the back end, as well as how to install the client for connecting to the back end (as is the case with many datastores), as well as how to configure cryptpad to use your adaptor.
The current configuration file should serve as an example of what to add, and how to comment.
