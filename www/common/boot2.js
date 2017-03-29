// This is stage 1, it can be changed but you must bump the version of the project.
define([], function () {
    // fix up locations so that relative urls work.
    require.config({ baseUrl: window.location.pathname });
    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
    require(['/common/rewrite-css.js']);
});

