define(function() {
    var config = {};

    /* Select the buttons displayed on the main page to create new collaborative sessions
     * Existing types : pad, code, poll, slide
     */
    config.availablePadTypes = ['drive', 'pad', 'code', 'slide', 'poll', 'whiteboard'];

    /*  Cryptpad apps use a common API to display notifications to users
     *  by default, notifications are hidden after 5 seconds
     *  You can change their duration here (measured in milliseconds)
     */
    config.notificationTimeout = 5000;

    config.whiteboardPalette = [
        '#000000', // black
        '#FFFFFF', // white
        '#848484', // grey
        '#8B4513', // saddlebrown
        '#FF0000', // red
        '#FF8080', // peach?
        '#FF8000', // orange
        '#FFFF00', // yellow
        '#80FF80', // light green
        '#00FF00', // green
        '#00FFFF', // cyan
        '#008B8B', // dark cyan
        '#0000FF', // blue
        '#FF00FF', // fuschia
        '#FF00C0', // hot pink
        '#800080', // purple
    ];

    return config;
});
