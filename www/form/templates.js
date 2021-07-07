define([
    '/customize/messages.js'
], function (Messages) {
    return [{
        id: 'a',
        used: 1,
        name: Messages.form_type_poll,
        content: {
            form: {
                "1": {
                    type: 'md'
                },
                "2": {
                    type: 'poll'
                }
            },
            order: ["1", "2"]
        }
    }];
});
