// This file originates from
// https://github.com/webxdc/vite-plugins/blob/main/src/webxdc.js
// It's a stub `webxdc.js` that adds a webxdc API stub for easy testing in
// browsers. In an actual webxdc environment (e.g. Delta Chat messenger) this
// file is not used and will automatically be replaced with a real one.
// See https://docs.webxdc.org/spec.html#webxdc-api

// @ts-check
/** @typedef {import('@webxdc/types/global')} */

/** @type {import('@webxdc/types').Webxdc<any>} */
window.webxdc = (() => {
  function h(tag, attributes, ...children) {
    const element = document.createElement(tag);
    if (attributes) {
      Object.entries(attributes).forEach((entry) => {
        element.setAttribute(entry[0], entry[1]);
      });
    }
    element.append(...children);
    return element;
  }

  let appIcon = undefined;
  async function getIcon() {
    if (appIcon) {
      return appIcon;
    }
    const img = new Image();
    try {
      img.src = "icon.png";
      await img.decode();
      appIcon = "icon.png";
    } catch (e) {
      img.src = "icon.jpg";
      try {
        await img.decode();
        appIcon = "icon.jpg";
      } catch (e) {}
    }
    return appIcon;
  }
  getIcon();

  let ephemeralUpdateKey = "__xdcEphemeralUpdateKey__";

  /**
   * @typedef {import('@webxdc/types').RealtimeListener} RT
   * @type {RT}
   */
  class RealtimeListener {
    constructor() {
      /** @private */
      this.listener = null;
      /** @private */
      this.trashed = false;
    }

    is_trashed() {
      return this.trashed;
    }

    receive(data) {
      if (this.trashed) {
        throw new Error(
          "realtime listener is trashed and can no longer be used",
        );
      }
      if (this.listener) {
        this.listener(data);
      }
    }

    setListener(listener) {
      this.listener = listener;
    }

    send(data) {
      if (!(data instanceof Uint8Array)) {
        throw new Error("realtime listener data must be a Uint8Array");
      }
      window.localStorage.setItem(
        ephemeralUpdateKey,
        JSON.stringify([window.webxdc.selfAddr, Array.from(data), Date.now()]), // Date.now() is needed to trigger the event
      );
    }

    leave() {
      this.trashed = true;
    }
  }

  let updateListener = (_) => {};
  /**
   * @type {RT | null}
   */
  let realtimeListener = null;
  const updatesKey = "__xdcUpdatesKey__";
  window.addEventListener("storage", (event) => {
    if (event.key == null) {
      window.location.reload();
    } else if (event.key === updatesKey) {
      const updates = JSON.parse(event.newValue);
      const update = updates[updates.length - 1];
      update.max_serial = updates.length;
      console.log("[Webxdc] " + JSON.stringify(update));
      if (update.notify && update._sender !== window.webxdc.selfAddr) {
        if (update.notify[window.webxdc.selfAddr]) {
          sendNotification(update.notify[window.webxdc.selfAddr]);
        } else if (update.notify["*"]) {
          sendNotification(update.notify["*"]);
        }
      }
      updateListener(update);
    } else if (event.key === ephemeralUpdateKey) {
      const [sender, update] = JSON.parse(event.newValue);
      // @ts-ignore: is_trashed() is private
      if (
        window.webxdc.selfAddr !== sender &&
        realtimeListener &&
        // @ts-ignore: is_trashed() is private
        !realtimeListener.is_trashed()
      ) {
        // @ts-ignore: receive() is private
        realtimeListener.receive(Uint8Array.from(update));
      }
    }
  });

  function getUpdates() {
    const updatesJSON = window.localStorage.getItem(updatesKey);
    return updatesJSON ? JSON.parse(updatesJSON) : [];
  }

  async function sendNotification(text) {
    console.log("[NOTIFICATION] " + text);

    const opts = { body: text, icon: await getIcon() };
    const title = "To: " + window.webxdc.selfName;
    if (Notification.permission === "granted") {
      new Notification(title, opts);
    } else {
      Notification.requestPermission((permission) => {
        if (Notification.permission === "granted") {
          new Notification(title, opts);
        }
      });
    }
  }

  function addXdcPeer() {
    const loc = window.location;
    // get next peer ID
    const params = new URLSearchParams(loc.hash.substr(1));
    const peerId = Number(params.get("next_peer")) || 1;

    // open a new window
    const peerName = "device" + peerId;
    const url =
      loc.protocol +
      "//" +
      loc.host +
      loc.pathname +
      "#name=" +
      peerName +
      "&addr=" +
      peerName +
      "@local.host";
    window.open(url);

    // update next peer ID
    params.set("next_peer", String(peerId + 1));
    window.location.hash = "#" + params.toString();
  }

  window.addEventListener("load", async () => {
    const styleControlPanel =
      "position: fixed; bottom:1em; left:1em; background-color: #000; opacity:0.8; padding:.5em; font-size:16px; font-family: sans-serif; color:#fff; z-index: 9999";
    const styleMenuLink =
      "color:#fff; text-decoration: none; vertical-align: middle";
    const styleAppIcon =
      "height: 1.5em; width: 1.5em; margin-right: 0.5em; border-radius:10%; vertical-align: middle";
    let title = document.getElementsByTagName("title")[0];
    if (typeof title == "undefined") {
      title = h("title");
      document.getElementsByTagName("head")[0].append(title);
    }
    title.innerText = window.webxdc.selfAddr;

    if (window.webxdc.selfName === "device0") {
      const addPeerBtn = h(
        "a",
        { href: "javascript:void(0);", style: styleMenuLink },
        "Add Peer",
      );
      addPeerBtn.onclick = () => addXdcPeer();
      const resetBtn = h(
        "a",
        { href: "javascript:void(0);", style: styleMenuLink },
        "Reset",
      );
      resetBtn.onclick = () => {
        window.localStorage.clear();
        window.location.reload();
      };
      const controlPanel = h(
        "div",
        { style: styleControlPanel },
        h(
          "header",
          { style: "margin-bottom: 0.5em; font-size:12px;" },
          "webxdc dev tools",
        ),
        addPeerBtn,
        h("span", { style: styleMenuLink }, " | "),
        resetBtn,
      );

      const icon = await getIcon();
      if (icon) {
        controlPanel.insertBefore(
          h("img", { src: icon, style: styleAppIcon }),
          controlPanel.childNodes[1],
        );
        document.head.append(h("link", { rel: "icon", href: icon }));
      }

      document.getElementsByTagName("body")[0].append(controlPanel);
    }
  });

  const params = new URLSearchParams(window.location.hash.substr(1));
  return {
    sendUpdateInterval: 1000,
    sendUpdateMaxSize: 999999,
    selfAddr: params.get("addr") || "device0@local.host",
    selfName: params.get("name") || "device0",
    setUpdateListener: (cb, serial = 0) => {
      const updates = getUpdates();
      const maxSerial = updates.length;
      updates.forEach((update) => {
        if (update.serial > serial) {
          update.max_serial = maxSerial;
          cb(update);
        }
      });
      updateListener = cb;
      return Promise.resolve();
    },
    joinRealtimeChannel: (cb) => {
      // @ts-ignore: is_trashed() is private
      if (realtimeListener && realtimeListener.is_trashed()) {
        return;
      }
      const rt = new RealtimeListener();
      // mimic connection establishment time
      setTimeout(() => (realtimeListener = rt), 500);
      return rt;
    },
    getAllUpdates: () => {
      console.log("[Webxdc] WARNING: getAllUpdates() is deprecated.");
      return Promise.resolve([]);
    },
    sendUpdate: (update) => {
      const updates = getUpdates();
      const serial = updates.length + 1;
      const _update = {
        payload: update.payload,
        summary: update.summary,
        info: update.info,
        notify: update.notify,
        href: update.href,
        document: update.document,
        serial: serial,
      };
      console.log(`[Webxdc] ${JSON.stringify(_update)}`);
      _update._sender = window.webxdc.selfAddr;
      updates.push(_update);
      window.localStorage.setItem(updatesKey, JSON.stringify(updates));
      _update.max_serial = serial;
      updateListener(_update);
    },
    sendToChat: async (content) => {
      if (!content.file && !content.text) {
        alert("🚨 Error: either file or text need to be set. (or both)");
        return Promise.reject(
          "Error from sendToChat: either file or text need to be set",
        );
      }

      /** @type {(file: Blob) => Promise<string>} */
      const blob_to_base64 = (file) => {
        const data_start = ";base64,";
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            /** @type {string} */
            //@ts-ignore
            let data = reader.result;
            resolve(data.slice(data.indexOf(data_start) + data_start.length));
          };
          reader.onerror = () => reject(reader.error);
        });
      };

      let base64Content;
      if (content.file) {
        if (!content.file.name) {
          return Promise.reject("file name is missing");
        }
        if (
          Object.keys(content.file).filter((key) =>
            ["blob", "base64", "plainText"].includes(key),
          ).length > 1
        ) {
          return Promise.reject(
            "you can only set one of `blob`, `base64` or `plainText`, not multiple ones",
          );
        }

        // @ts-ignore - needed because typescript imagines that blob would not exist
        if (content.file.blob instanceof Blob) {
          // @ts-ignore - needed because typescript imagines that blob would not exist
          base64Content = await blob_to_base64(content.file.blob);
          // @ts-ignore - needed because typescript imagines that base64 would not exist
        } else if (typeof content.file.base64 === "string") {
          // @ts-ignore - needed because typescript imagines that base64 would not exist
          base64Content = content.file.base64;
          // @ts-ignore - needed because typescript imagines that plainText would not exist
        } else if (typeof content.file.plainText === "string") {
          base64Content = await blob_to_base64(
            // @ts-ignore - needed because typescript imagines that plainText would not exist
            new Blob([content.file.plainText]),
          );
        } else {
          return Promise.reject(
            "data is not set or wrong format, set one of `blob`, `base64` or `plainText`, see webxdc documentation for sendToChat",
          );
        }
      }
      const msg = `The app would now close and the user would select a chat to send this message:\nText: ${
        content.text ? `"${content.text}"` : "No Text"
      }\nFile: ${
        content.file
          ? `${content.file.name} - ${base64Content.length} bytes`
          : "No File"
      }`;
      if (content.file) {
        const confirmed = confirm(
          msg + "\n\nDownload the file in the browser instead?",
        );
        if (confirmed) {
          const dataURL =
            "data:application/octet-stream;base64," + base64Content;
          const element = h("a", {
            href: dataURL,
            download: content.file.name,
          });
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }
      } else {
        alert(msg);
      }
    },
    importFiles: (filters) => {
      const accept = [
        ...(filters.extensions || []),
        ...(filters.mimeTypes || []),
      ].join(",");
      const element = h("input", {
        type: "file",
        accept,
        multiple: filters.multiple || false,
      });
      const promise = new Promise((resolve, _reject) => {
        element.onchange = (_ev) => {
          console.log("element.files", element.files);
          const files = Array.from(element.files || []);
          document.body.removeChild(element);
          resolve(files);
        };
      });
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      console.log(element);
      return promise;
    },
  };
})();
