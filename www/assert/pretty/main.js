define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js'
], function ($, Hyperjson) {
    var shjson = '["BODY",{"class":"cke_editable cke_editable_themed cke_contents_ltr cke_show_borders","spellcheck":"false"},[["P",{},["This is ",["STRONG",{},["CryptPad"]],", the zero knowledge realtime collaborative editor.",["BR",{},[]],"What you type here is encrypted so only people who have the link can access it.",["BR",{},[]],"Even the server cannot see what you type."]],["P",{},[["SMALL",{},[["I",{},["What you see here, what you hear here, when you leave here, let it stay here"]]]],["BR",{"type":"_moz"},[]]]]]]';

    var hjson = JSON.parse(shjson);

    var pretty = Hyperjson.toString(hjson);

    // set the body html to the rendered hyperjson
    $('body')[0].outerHTML = pretty;

    $('body')
        // append the stringified-hyperjson source for reference
        .append('<hr>').append($('<pre>', {
            'class': 'wrap',
        }).text(shjson))
        // append the pretty-printed html source for reference
        .append('<hr>').append($('<pre>').text(pretty));


    // TODO write some tests to confirm whether the pretty printer is correct
});
