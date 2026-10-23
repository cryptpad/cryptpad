define([
    '/common/common-util.js',
    '/common/yjs-bundle.js',
    '/common/inner/rtchannel.js',
], (Util, YBundle, RtChannel) => {
    const YProvider = {};
    const { YJS:Y } = YBundle;

    YProvider.create = cfg => {
        const { APP, framework, common, ydoc, myId } = cfg;

        APP.onLocal ||= framework?.localChange;
        APP.realtime ||= framework?._.cpNfInner.chainpad;

        const rtcTools = RtChannel.init(APP, common);
        const {
            setContent,
            getLastCp,
            rtChannel,
            onRTCMessage,
            openRtChannel
        } = rtcTools;

        const onRemote = Util.mkEvent();

        onRTCMessage.reg(data => {
            console.error("RECEIVING UPDATE", data.msg);
            const update = Util.decodeBase64(data.msg);
            Y.applyUpdate(ydoc, update);
            onRemote.fire();
        });

        const onUpdate = (update, origin) => {
            if (origin !== myId) { return; }
            const msg = Util.encodeBase64(update);
            rtChannel.sendMsg(msg, false, () => {
                console.error('msg sent', msg);
            });
        };
        const onDestroy = () => {
            ydoc.off('update', onUpdate);
            ydoc.off('destroy', onDestroy);
        };

        ydoc.on('update', onUpdate);
        ydoc.on('destroy', onDestroy);

        const initWS = () => {
            const cpData = getLastCp();
            openRtChannel(cpData, () => {
                console.error('rtchannel ready');
            });
        };

        return {
            initWS,
            onRemote: onRemote.reg,
            setContent
        };
    };

    return YProvider;
});
