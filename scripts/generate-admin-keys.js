/* jshint esversion: 6, node: true */

const Nacl = require('tweetnacl');

const keyPair = Nacl.box.keyPair();
console.log("You've just generated a new key pair for your support mailbox.");

console.log("The public key should first be added to your config.js file ('supportMailboxPublicKey'), then save and restart the server.");
console.log("Once restarted, administrators (specified with 'adminKeys' in config.js too) will be able to add the private key into their account. This can be done using the administration panel.");
console.log("You will have to send the private key to each administrator manually so that they can add it to their account.");
console.log();
console.log("WARNING: the public and private keys must come from the same key pair to have a working encrypted support mailbox.");
console.log();
console.log("NOTE: You can change the key pair at any time if you want to revoke access to the support mailbox. You just have to generate a new key pair using this file, and replace the value in config.js, and then send the new private key to the administrators of your choice.");


console.log();
console.log();
console.log("Your public key (add it to config.js):");
console.log(Nacl.util.encodeBase64(keyPair.publicKey));

console.log();
console.log();
console.log("Your private key (store it in a safe place and send it to your instance's admins):");
console.log(Nacl.util.encodeBase64(keyPair.secretKey));
