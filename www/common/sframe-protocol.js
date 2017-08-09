// This file defines all of the RPC calls which are used between the inner and outer iframe.
// Define *querys* (which expect a response) using Q_<query name>
// Define *events* (which expect no response) using EV_<event name>
// Please document the queries and events you create, and please please avoid making generic
// "do stuff" events/queries which are used for many different things because it makes the
// protocol unclear.
//
// WARNING: At this point, this protocol is still EXPERIMENTAL. This is not it's final form.
//   We need to define protocol one piece at a time and then when we are satisfied that we
//   fully understand the problem, we will define the *right* protocol and this file will be dynomited.
//
define({
    // When the iframe first launches, this query is sent repeatedly by the controller
    // to wait for it to awake and give it the requirejs config to use.
    'Q_INIT': true,

    // When either the outside or inside registers a query handler, this is sent.
    'EV_REGISTER_HANDLER': true,

    // Realtime events called from the outside.
    // When someone joins the pad, argument is a string with their netflux id.
    'EV_RT_JOIN': true,
    // When someone leaves the pad, argument is a string with their netflux id.
    'EV_RT_LEAVE': true,
    // When you have been disconnected, no arguments.
    'EV_RT_DISCONNECT': true,
    // When you have connected, argument is an object with myID: string, members: list, readOnly: boolean.
    'EV_RT_CONNECT': true,
    // Called after the history is finished synchronizing, no arguments.
    'EV_RT_READY': true,
    // Called from both outside and inside, argument is a (string) chainpad message.
    'Q_RT_MESSAGE': true,

    // Called from the outside, this informs the inside whenever the user's data has been changed.
    // The argument is the object representing the content of the user profile minus the netfluxID
    // which changes per-reconnect.
    'EV_USERDATA_UPDATE': true
});