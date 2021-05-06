---
name: Initial instance configuration
about: Difficulty configuring a CryptPad instance
title: CONFIG
labels: configuration
assignees: ''

---

We receive many issues from people that have tried to set up a new CryptPad instance that does not load any of the interactive editors or which mostly works but has particular problems with the sheet editor.

Before you create an issue:

## Confirm that the problem stems from your instance and not from your browser

Not all browsers support CryptPad correctly, and various browser extensions interfere with its intended behaviour.

https://CryptPad.fr is a good reference point that you can use to confirm that your browser can load a correctly configured instance. If you can't load CryptPad.fr then the problem may be with your browser, its configuration, or one of its active extensions.

## See your instance's checkup page

If your instance is able to at least partially load some pages then you should be able to access the diagnostic page `http(s)://<your-domain>/checkup/`. It will perform some automated tests of your instance's configuration and will provide hints indicating:

1. what is incorrect about your configuration
2. what to change in order to correct the problem

## Write down the exact steps you followed to configure your instance

0. Provide the URL of the guide you followed
1. Confirm that your system has the necessary pre-requisites
  * Did you fetch the source code with `git` as recommended?
  * Have you installed the recommend version of Nodejs (12.14.0) using [NVM](https://github.com/nvm-sh/nvm)?
  * Have you installed `bower` using `npm`?
  * Have you fetched the latest source code? Run `git branch` and confirm that it returns either `main` or [the latest of our releases](github.com/xwiki-labs/cryptpad/releases/latest).
2. Did you copy `cryptpad/config/config.example.js` to `cryptpad/config/config.js`, read the comments, and edit the fields which are described as being necessary for a production environment?
3. Did you restart the application server (`server.js`) after making configuration changes?
4. Are you running NGINX as a reverse proxy as we recommend?
5. Have you generated an SSL certificate that is valid for both the domains that are required by the sandboxing system?
6. Do the domains in your NGINX conf match those in `cryptpad/config/config.js`?

## Review the steps you took

If the answer to any of the above questions is _No_ then that is the most likely cause of your difficulty.

Identifying the problem on your own reduces the time we spend answering GitHub issues and leaves more time to fix actual bugs and develop new features.

## Create a detailed report

If you believe you've done all of those steps correctly then proceed with creating an issue with the following:

0. A concise description of the problem you're experiencing and why you believe it stems from a bug in the software and not a configuration issue
1. The list of all the steps you wrote down when following our instructions above
2. A link to your instance so we can easily load your `/checkup/` page for ourselves
3. A list of any errors visible in your browser's console on whichever page is not behaving as expected
4. A list of any further steps you've taken to debug the problem on your own

Finally, remove the text of this issue template and leave only the content you've written.
