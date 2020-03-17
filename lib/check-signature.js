/* jshint esversion: 6 */
/* global process */
const Nacl = require('tweetnacl/nacl-fast');

// XXX npm "os" and "child_process"

// TODO if this process is using too much CPU, we can use "cluster" to add load balancing to this code

console.log('New child process', process.pid);

process.on('message', function (data) {
    console.log('In process', process.pid);
    console.log(+new Date(), "Message received by subprocess");
    if (!data || !data.key || !data.msg || !data.txid) {
        process.send({
            error:'E_INVAL'
        });
        return;
    }
    const txid = data.txid;

    const signedMsg = Nacl.util.decodeBase64(data.msg);
    var validateKey;
    try {
        validateKey = Nacl.util.decodeBase64(data.key);
    } catch (e) {
        process.send({
            txid: txid,
            error:'E_BADKEY'
        });
        return;
    }
    // validate the message
    const validated = Nacl.sign.open(signedMsg, validateKey);
    if (!validated) {
        process.send({
            txid: txid,
            error:'FAILED'
        });
        return;
    }
    console.log(+new Date(), "Verification done in the subprocess");
    process.send({
        txid: txid,
        success: true
    });
});
