if (!self.crypto && !self.msCrypto) {
    throw new Error("E_NOCRYPTO");
}
postMessage("OK");
