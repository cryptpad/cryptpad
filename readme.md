# CryptPad

CryptPad is a collaboration suite that is end-to-end-encrypted and open-source. It is built to enable collaboration, synchronizing changes to documents in real time. Because all data is encrypted, the service and its administrators have no way of seeing the content being edited and stored.

![CryptPad screenshot](screenshot.png "Private real-time collaboration on a Rich Text document.")

# Installation

## For development

Our [developer guide](https://docs.cryptpad.fr/en/dev_guide/setup.html) provides instructions for setting up a local instance without HTTPS or our more advanced security features.

## For production

Configuring CryptPad for production requires a little more work, but the process is described in our [admin installation guide](https://docs.cryptpad.fr/en/admin_guide/installation.html). From there you can find more information about customization and maintenance.

## Current version

The most recent version and all past release notes can be found [here](https://github.com/xwiki-labs/cryptpad/releases/).

## Setup using Docker

See [Cryptpad-Docker](https://github.com/xwiki-labs/cryptpad-docker) repository for details on how to get up-and-running with Cryptpad in Docker. This repository is maintained by the community and not officially supported.

# Security

CryptPad offers a variety of collaborative tools that encrypt your data in your browser
before it is sent to the server and your collaborators. In the event that the server is
compromized the database holds encrypted data that is not of much value to attackers.

The code which performs the encryption is still loaded from the host server like any
other web page, so you still need to trust the administrator to keep their server secure
and to send you the right code. An expert can download code from the server and check
that it isn't doing anything malicious like leaking your encryption keys, which is why
this is considered an [active attack].

The platform is designed to minimize what data is exposed to its operators. User registration
and account access is based on a cryptographic key that is derived from your username
and password so the server never needs to see either and you don't need to worry about
whether they are being stored securely. It is impossible to verify whether a server's
operators are logging your IP or other activity, so if you consider this information
sensitive it is safest to assume it is being recorded and access your preferred instance
via [Tor browser].

A correctly configured instance has safeguards to prevent collaborators from doing some
nasty things like injecting scripts into collaborative documents or uploads. The project
is actively maintained and bugs that our safeguards don't catch tend to get fixed quickly.
For this reason it is best to only use instances that are running the most recent version,
which is currently on a three-week release cycle. It is difficult for a non-expert to
determine whether an instance is otherwise configured correctly, so we are actively
working on allowing administrators to opt in to a public directory of servers that
meet our strict criteria for safety.

# Translations

CryptPad can be translated with nothing more than a web browser via our
[Weblate instance](https://weblate.cryptpad.fr/projects/cryptpad/app/).
More information about this can be found in [our translation guide](/customize.dist/translations/README.md).

# Contacting Us

You can reach members of the CryptPad development team on [Twitter](https://twitter.com/cryptpad),
via our [GitHub issue tracker](https://github.com/xwiki-labs/cryptpad/issues/), on our
[Matrix channel](https://riot.im/app/#/room/#cryptpad:matrix.org), or by
[e-mail](mailto:research@xwiki.com).

# Team

CryptPad is actively developed by a team at [XWiki SAS](https://www.xwiki.com), a company that has been building Open-Source software since 2004 with contributors from around the world. Between 2015 and 2019 it was funded by a research grant from the French state through [BPI France](https://www.bpifrance.fr/). In the years since we have been funded by [NLnet PET](https://nlnet.nl/PET/), [NGI TRUST](https://www.ngi.eu/ngi-projects/ngi-trust/), [NGI DAPSI](https://dapsi.ngi.eu/), subscribers of CryptPad.fr, and donations to our [Open-Collective campaign](https://opencollective.com/cryptpad).

# Contributing

We love Open Source and we love contribution. Learn more about [contributing](https://docs.cryptpad.fr/en/how_to_contribute.html). 

If you have any questions or comments, or if you're interested in contributing to Cryptpad, come say hi in our [Matrix channel](https://app.element.io/#/room/#cryptpad:matrix.xwiki.com).

# License

![AGPL logo](https://www.gnu.org/graphics/agplv3-155x51.png "GNU Affero General Public License")

This software is and will always be available under the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the License, or (at your option)
any later version. If you wish to use this technology in a proprietary product, please contact
sales@xwiki.com.

[Tor browser]: https://www.torproject.org/download/
[active attack]: https://en.wikipedia.org/wiki/Attack_(computing)#Types_of_attack

