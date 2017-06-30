[![XWiki labs logo](https://raw.githubusercontent.com/xwiki-labs/xwiki-labs-logo/master/projects/xwikilabs/xlabs-project.png "XWiki labs")](https://labs.xwiki.com/xwiki/bin/view/Main/WebHome)

<p align="center">
<img src="https://github.com/cjdelisle/cryptpad/raw/master/cryptofist.png" width="60%">
</p>

Unity is Strength - Collaboration is Key



![and_so_it_begins.png](https://github.com/cjdelisle/cryptpad/raw/master/and_so_it_begins.png "We are the 99%")

CryptPad is the **zero knowledge** realtime collaborative editor.
Encryption carried out in your web browser protects the data from the server, the cloud
and the NSA. This project uses the [CKEditor] Visual Editor and the [ChainPad] realtime
engine. The secret key is stored in the URL [fragment identifier] which is never sent to
the server but is available to javascript so by sharing the URL, you give authorization
to others who want to participate.


# Installation

Cryptpad depends on the Nodejs runtime.
We recommend installing it via [NVM](https://github.com/creationix/nvm "Node Version Manager") to ensure that you are running an up to date version.

Once you have a recent runtime (we use v6.6.0):

```
git clone <this repo>
cd cryptpad
npm install
npm install -g bower ## if necessary
bower install

## copy config.example.js to config.js
cp config.example.js config.js

node ./server.js
```

## Configuration

CryptPad _should_ work with an unmodified configuration file, though there are many things which you may want to customize.
Attributes in the config should have comments indicating how they are used.

```
$EDITOR config.js
```

If you are deploying CryptPad in a production environment, we recommend that you take the time to understand and correctly customize your server's [Content Security Policy headers](https://content-security-policy.com/).
Modern browsers use these headers to allow or deny actions from malicious clients which could compromise the confidentiality of your user's data.

These settings can be found in your configuration file in the  `contentSecurity` and `padContentSecurity` sections.

## Maintenance

Before upgrading your CryptPad instance to the latest version, we recommend that you check what has changed since your last update.
You can do so by checking which version you have (see package.json), and comparing it against newer [release notes](https://github.com/xwiki-labs/cryptpad/releases).

To get access to the most recent codebase:

```
cd /your/cryptpad/instance/location;
git pull
```

To update dependencies:

```
# clientside dependencies
bower update;

# serverside dependencies
npm update;
```
## Deleting all data and resetting Cryptpad


To reset your instance of Cryptpad and remove all the data that is being stored:

**WARNING: This will reset your Cryptpad instance and remove all data**
```
# change into your cryptpad directory
cd /your/cryptpad/instance/location;

# delete the datastore
rm -rf ./datastore
```

If you are using the mongodb adaptor, [drop the relevant collection](https://docs.mongodb.org/manual/reference/method/db.collection.drop/#db.collection.drop).

If you are using the [leveldb adaptor](https://github.com/xwiki-labs/cryptpad-level-store), delete the datastore directory you have configured.

## Testing

To test CryptPad, go to http://your.server:3000/assert/

You can use WebDriver to run this test automatically by running TestSelenium.js but you will need chromedriver installed.
If you use Mac, you can `brew install chromedriver`.

## Developing CryptPad

CryptPad is built with a lot of small javascript libraries.
To make js files load faster, we apply an aggressive caching policy.

If you want to add new features to CryptPad, you'll want to turn off caching.
You can do so by launching your server in _dev mode_, like so:

`DEV=1 node server.js`

## Security

CryptPad is *private*, not *anonymous*. Privacy protects your data, anonymity protects you.
As such, it is possible for a collaborator on the pad to include some silly/ugly/nasty things
in a CryptPad such as an image which reveals your IP address when your browser automatically
loads it or a script which plays Rick Astleys's greatest hits. It is possible for anyone
who does not have the key to be able to change anything in the pad or add anything, even the
server, however the clients will notice this because the content hashes in ChainPad will fail to
validate.

The server does have a certain power, it can send you evil javascript which does the wrong
thing (leaks the key or the data back to the server or to someone else). This is however an
[active attack] which makes it detectable. The NSA really hates doing these because they might
get caught and laughed at and humiliated in front of the whole world (again). If you're making
the NSA mad enough for them to use an active attack against you, Great Success Highfive, now take
the battery out of your computer before it spawns Agent Smith.

Still there are other low-lives in the world so using CryptPad over HTTPS is probably a good idea.

## Setup using Docker

See [Cryptpad-Docker](cryptpad-docker.md)

## Translations

We'd like to make it easy for more people to use encryption in their routine activities.
As such, we've tried to make language-specific parts of CryptPad translatable. If you're
able to translate CryptPad's interface, and would like to help, please contact us!

You can also see [our translation guide](/customize.dist/translations/README.md).

## Contacting Us

You can reach members of the CryptPad development team on [twitter](https://twitter.com/cryptpad),
via our [github issue tracker](https://github.com/xwiki-labs/cryptpad/issues/), on the
[freenode](http://webchat.freenode.net/?channels=%23cryptpad&uio=MT1mYWxzZSY5PXRydWUmMTE9Mjg3JjE1PXRydWUe7)
irc network, or by [email](mailto:research@xwiki.com).

## Contributing

We love Open Source and we love contribution. It is our intent to keep this project available
under the AGPL license forever but in order to finance more development on this and other FOSS
projects, we also wish to sell other licenses to this software. Before making a pull request,
please read and
[sign the Commons Management Agreement](https://www.clahub.com/agreements/cjdelisle/cryptpad).

If you have any questions or comments, or if you're interested in contributing to Cryptpad, come say hi on IRC, `#cryptpad` on Freenode.

### License

This software is and will always be available under the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the License, or (at your option)
any later version. If you wish to use this technology in a proprietary product, please contact
sales@xwiki.com

[ChainPad]: https://github.com/xwiki-contrib/chainpad
[CKEditor]: http://ckeditor.com/
[fragment identifier]: https://en.wikipedia.org/wiki/Fragment_identifier
[active attack]: https://en.wikipedia.org/wiki/Attack_(computing)#Types_of_attacks
[Creative Commons Attribution 2.5 License]: http://creativecommons.org/licenses/by/2.5/
