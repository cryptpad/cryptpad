/* jshint esversion: 6, node: true */
/**
 * Automated compilation of media-tag-nacl.min.js in www/common 
 * Re-run whenever media-tag.js or requirements have been changed
 **/

const Fs = require('fs');
const jQueryCode = Fs.readFileSync('../www/bower_components/jquery/dist/jquery.min.js');
const naclCode = Fs.readFileSync('../www/bower_components/tweetnacl/nacl-fast.min.js');
const mediatagCode = Fs.readFileSync('../www/common/media-tag.js');
const outputFile = '../www/common/media-tag-nacl.min.js';

// Return the contents of function func as a string
function extract_code(func) {
    return func.toString().replace( /function[^\n]*{\n((\n|.)*)\n}$/m, '$1' );
}

const moduleWrapperCode = extract_code(function(){

    // When compiling all requirements into a single file,
    // there is no module context which the mediatag factory requires.
    var module = function(){};
    module.exports = function(){};
});

const activationCode = extract_code(function() {
    // Activation function to convert all media-tag tags.
    $(function () {
        // Convert all existing media tags
        $('media-tag').each( function(index, node) {
            module.exports(node);
        });

        // Create an observer instance for future media tags
        var observer = new MutationObserver( function( mutations ) {
            mutations.forEach( function( mutation ) {
                var newNodes = mutation.addedNodes; // DOM NodeList
                if( newNodes !== null ) { // If there are new nodes added
                    $( newNodes ).find('media-tag').each( function(index, node) {
                        module.exports(node)
                    });
                }
            });
        });
        // Run observer on document.body
        observer.observe(document.body, { attributes: false, childList: true, characterData: false, subtree: true });
    });
});

const compiledCode = '(' + Function(
    jQueryCode
    + naclCode
    + moduleWrapperCode + mediatagCode
    + activationCode
).toString() + ')()\n';

Fs.writeFileSync(outputFile, compiledCode);
console.log( "Code for " + outputFile + " successfully generated." )

