(function () {
  "use strict";

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function safeUint8ToBase64(arr) {
    let bin = "";
    for (let i = 0; i < arr.byteLength; i++) {
      bin += String.fromCharCode(arr[i]);
    }
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function safeBase64ToUint8(b64) {
    let standard = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (standard.length % 4) standard += "=";
    const bin = atob(standard);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }

  async function getKey(pw, salt) {
    const base = await crypto.subtle.importKey(
      "raw",
      enc.encode(pw),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 200000,
        hash: "SHA-256",
      },
      base,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  const EncryptHandler = {
    encrypt: async () => {
      const inputEl = document.getElementById("data-input");
      const passEl = document.getElementById("data-pass");
      if (!inputEl || !passEl) return;

      const t = inputEl.value;
      const p = passEl.value;
      if (!t || !p) return;

      const encBtn = document.getElementById("encrypt-btn");
      const prevText = encBtn.innerText;
      encBtn.disabled = true;
      encBtn.innerText = "Encrypting...";

      try {
        const s = crypto.getRandomValues(new Uint8Array(16));
        const v = crypto.getRandomValues(new Uint8Array(12));
        const k = await getKey(p, s);
        const e = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: v },
          k,
          enc.encode(t),
        );

        const res = new Uint8Array(28 + e.byteLength);
        res.set(s, 0);
        res.set(v, 16);
        res.set(new Uint8Array(e), 28);

        const base = window.routerBasePath || "";
        const resultUrl = `${window.location.origin}${base}/tools/data#${safeUint8ToBase64(res)}`;
        document.getElementById("encrypt-result").value = resultUrl;
        document.getElementById("result-area").classList.remove("is-hidden");
      } catch (err) {
        console.error("Encryption error:", err);
      } finally {
        encBtn.disabled = false;
        encBtn.innerText = prevText;
      }
    },
    decrypt: async () => {
      const h = window.location.hash.substring(1);
      const passEl = document.getElementById("decrypt-pass");
      if (!h || !passEl) return;
      const p = passEl.value;
      if (!p) return;

      const decBtn = document.getElementById("decrypt-btn");
      const prevText = decBtn.innerText;
      decBtn.disabled = true;
      decBtn.innerText = "Decrypting...";

      try {
        const d = safeBase64ToUint8(h);
        const k = await getKey(p, d.slice(0, 16));
        const out = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: d.slice(16, 28) },
          k,
          d.slice(28),
        );

        document.getElementById("decrypted-output").innerText = dec.decode(out);
        document
          .getElementById("decrypted-output-container")
          .classList.remove("is-hidden");
        document.getElementById("decrypt-error").classList.add("is-hidden");
      } catch (e) {
        document.getElementById("decrypt-error").innerText = "Invalid password or corrupted link.";
        document.getElementById("decrypt-error").classList.remove("is-hidden");
      } finally {
        decBtn.disabled = false;
        decBtn.innerText = prevText;
      }
    },
  };

  const resetToCreateView = () => {
    const base = window.routerBasePath || "";
    history.pushState(null, "", `${base}/tools/data`);

    const createSec = document.getElementById("create-section");
    const decSec = document.getElementById("decrypt-section");
    const resArea = document.getElementById("result-area");
    const decContainer = document.getElementById("decrypted-output-container");
    const input = document.getElementById("data-input");
    const pass = document.getElementById("data-pass");

    if (createSec) createSec.classList.remove("is-hidden");
    if (decSec) decSec.classList.add("is-hidden");
    if (resArea) resArea.classList.add("is-hidden");
    if (decContainer) decContainer.classList.add("is-hidden");
    if (input) input.value = "";
    if (pass) pass.value = "";
  };

  const init = () => {
    const encBtn = document.getElementById("encrypt-btn");
    if (!encBtn) return;

    encBtn.onclick = EncryptHandler.encrypt;
    document.getElementById("decrypt-btn").onclick = EncryptHandler.decrypt;

    document.getElementById("decrypt-pass").oninput = () => {
      document.getElementById("decrypt-error").classList.add("is-hidden");
    };

    document.getElementById("gen-pass-btn").onclick = () => {
      const charset =
        "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
      document.getElementById("data-pass").value = Array.from(
        crypto.getRandomValues(new Uint32Array(16)),
      )
        .map((x) => charset[x % charset.length])
        .join("");
    };

    document.getElementById("copy-encrypt-btn").onclick = () => {
      const copyInput = document.getElementById("encrypt-result");
      navigator.clipboard.writeText(copyInput.value);
      const copyBtn = document.getElementById("copy-encrypt-btn");
      copyBtn.innerText = "Copied";
      setTimeout(() => (copyBtn.innerText = "Copy"), 2000);
    };

    const toggleBtn = document.getElementById("toggle-pass-btn");
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const passInput = document.getElementById("data-pass");
        const icon = toggleBtn.querySelector("i");
        if (passInput.type === "password") {
          passInput.type = "text";
          icon.className = "fas fa-eye-slash";
        } else {
          passInput.type = "password";
          icon.className = "fas fa-eye";
        }
      };
    }

    const createNewBtn = document.getElementById("create-new-btn");
    if (createNewBtn) {
      createNewBtn.onclick = (e) => {
        e.preventDefault();
        resetToCreateView();
      };
    }

    const closeFragBtn = document.getElementById("close-fragment-btn");
    if (closeFragBtn) {
      closeFragBtn.onclick = resetToCreateView;
    }

    if (window.location.hash.length > 20) {
      document.getElementById("create-section").classList.add("is-hidden");
      document.getElementById("decrypt-section").classList.remove("is-hidden");
    } else {
      document.getElementById("create-section").classList.remove("is-hidden");
      document.getElementById("decrypt-section").classList.add("is-hidden");
    }
  };

  window.addEventListener("hashchange", () => {
    if (window.location.pathname.endsWith("/tools/data")) init();
  });

  document.addEventListener("spa-content-loaded", init);
})();
