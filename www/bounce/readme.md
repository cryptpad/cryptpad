# Bounce app

This app redirects you to a new URL.
This app must only be served from CryptPad's safe origin, if this app detects that it is being
served from the unsafe origin, it will throw an alert that it is misconfigured and it will refuse
to redirect.

If the URL is a javascript: URL, it will be trapped by CryptPad's Content Security Policy rules
or in the worst case, it will run in the context of the sandboxed origin.