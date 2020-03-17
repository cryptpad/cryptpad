/* jshint esversion: 6 */
/* global process */
const Nacl = require('tweetnacl/nacl-fast');

// XXX npm "os" and "child_process"

// TODO if this process is using too much CPU, we can use "cluster" to add load balancing to this code

console.log('New child process', process.pid);

process.on('message', function (data) {
    //console.log('In process', process.pid);
    //console.log(+new Date(), "Message received by subprocess");
    if (!data || !data.key || !data.msg || !data.txid) {
        return void process.send({
            error:'E_INVAL'
        });
    }
    const txid = data.txid;

    var signedMsg;
    try {
        signedMsg = Nacl.util.decodeBase64(data.msg);
    } catch (e) {
        return void process.send({
            txid: txid,
            error: 'E_BAD_MESSAGE',
        });
    }

    var validateKey;
    try {
        validateKey = Nacl.util.decodeBase64(data.key);
    } catch (e) {
        return void process.send({
            txid: txid,
            error:'E_BADKEY'
        });
    }
    // validate the message
    const validated = Nacl.sign.open(signedMsg, validateKey);
    if (!validated) {
        return void process.send({
            txid: txid,
            error:'FAILED'
        });
    }
    process.send({
        txid: txid,
    });
});
