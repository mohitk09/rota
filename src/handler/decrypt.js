const crypto = require("crypto");
const fs = require("fs");

const decryptPayload = (base64encodedPayload, decryptedSymetricKey) => {
  const iv = Buffer.alloc(16, 0);
  decryptedSymetricKey.copy(iv, 0, 0, 16);
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    decryptedSymetricKey,
    iv
  );
  let decryptedPayload = decipher.update(
    base64encodedPayload,
    "base64",
    "utf8"
  );
  decryptedPayload += decipher.final("utf8");
  console.log({ decryptedPayload });
};

const compareSignature = (decryptedSymetricKey) => {
  const base64encodedSignature = "mXduIN/PiodxKxwfJrywJuFW+ovcspEeace7UBQP91I=";
  const hmac = crypto.createHmac("sha256", decryptedSymetricKey);
  base64encodedPayload =
    "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";
  hmac.write(base64encodedPayload, "base64");
  const signatureExpected = hmac.digest("base64");
  console.log({ signatureExpected });
  if (base64encodedSignature === signatureExpected) {
    decryptPayload(base64encodedPayload, decryptedSymetricKey);
    // Continue with decryption of the encryptedPayload.
  } else {
    console.log("Why");
    // Do not attempt to decrypt encryptedPayload. Assume notification payload has been tampered with and investigate.
  }
};

const generateSignature = () => {
  const base64encodedKey =
    "o9Viv6gqliqGIxAlLqu+Fphy1ZX+3ptjmtq17+tA6+/k7/x8kKsYNeypCdRfL/NbddMCwsunhRzaYcDGneaCtKrwq86VeVK20E0JgbOUrPZSENh97a+Nw+teKnhBtSDJE2fRBbpsNrNf/wmu0qrlnHoCWd81pl8e73X1oE8szYk=";
  const decodedKey = Buffer.from(base64encodedKey, "base64");
  const asymetricPrivateKey = fs.readFileSync("private.key", "utf8");
  const decryptedSymetricKey = crypto.privateDecrypt(
    asymetricPrivateKey,
    decodedKey
  );
  compareSignature(decryptedSymetricKey);
};

generateSignature();
