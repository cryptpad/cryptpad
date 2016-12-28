define([
    '/common/cryptget.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypt, Crypto) {
    var $ = window.jQuery;
    var Nacl = window.nacl;

    var key = Nacl.randomBytes(32);

    var handleFile = function (body) {
        //console.log("plaintext");
        //console.log(body);

        0 && Crypt.put(body, function (e, out) {
            if (e) { return void console.error(e); }
            if (out) {
                console.log(out);
            }
        });

        var data = {};

(_ => {
        var cyphertext = data.payload = Crypto.encrypt(body, key);
        console.log("encrypted");
        console.log(cyphertext);

        console.log(data);

        var decrypted = Crypto.decrypt(cyphertext, key);
        //console.log('decrypted');
        //console.log(decrypted);


        if (decrypted !== body) {
            throw new Error("failed to maintain integrity with round trip");
        }

        // finding... files are entirely too large.


        console.log(data.payload.length, body.length); // 1491393, 588323
        console.log(body.length / data.payload.length); // 0.3944788529918003
        console.log(data.payload.length / body.length); // 2.534990132971174

/*

http://stackoverflow.com/questions/19959072/sending-binary-data-in-javascript-over-http

        // Since we deal with Firefox and Chrome only 
        var bytesToSend = [253, 0, 128, 1];
        var bytesArray = new Uint8Array(bytesToSend);

        $.ajax({
           url: '%your_service_url%',
           type: 'POST',
           contentType: 'application/octet-stream',  
           data: bytesArray,
           processData: false
        });
*/
})();
    };

    var $file = $('input[type="file"]');
    $file.on('change', function (e) { 
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            handleFile(e.target.result);
        };
        reader.readAsText(file);
    });
});
