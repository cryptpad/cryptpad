if (!self.crypto && !self.msCrypto) {
    throw new Error("E_NOCRYPTO");
}
self.postMessage("OK");
