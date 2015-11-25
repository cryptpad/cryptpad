define(function () {
    var out = {};

    out.errorBox_errorType_disconnected = 'Connection Lost';
    out.errorBox_errorExplanation_disconnected = [
        'Lost connection to server, you may reconnect by reloading the page or review your work ',
        'by clicking outside of this box.'
    ].join('');

    out.editingAlone = 'Editing alone';
    out.editingWithOneOtherPerson = 'Editing with one other person';
    out.editingWith = 'Editing with';
    out.otherPeople = 'other people';
    out.disconnected = 'Disconnected';
    out.synchronizing = 'Synchronizing';
    out.reconnecting = 'Reconnecting...';
    out.lag = 'Lag';

    out.initialState = [
        '<p>',
        'This is <strong>CryptPad</strong>, the zero knowledge realtime collaborative editor.',
        '<br>',
        'What you type here is encrypted so only people who have the link can access it.',
        '<br>',
        'Even the server cannot see what you type.',
        '</p>',
        '<p>',
        '<small>',
        '<i>What you see here, what you hear here, when you leave here, let it stay here</i>',
        '</small>',
        '</p>',
    ].join('');

    out.codeInitialState = [
        '/*\n',
        'This is CryptPad, the zero knowledge realtime collaborative editor.\n',
        'What you type here is encrypted so only people who have the link can access it.\n',
        'Even the server cannot see what you type.\n',
        'What you see here, what you hear here, when you leave here, let it stay here\n',
        '*/'
    ].join('');

    return out;
});
