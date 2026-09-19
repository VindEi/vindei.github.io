(function () {
  "use strict";
  const enc = new TextEncoder(),
    dec = new TextDecoder();

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

  const Encrypt = {
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
      encBtn.innerText = "Deriving Keys & Locking...";

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

        // Generates strict /tools/data# link
        document.getElementById("Encrypt-result").value =
          `${window.location.origin}/tools/data#${safeUint8ToBase64(res)}`;
        document.getElementById("result-area").style.display = "block";
      } catch (err) {
        console.error("Encryption failed:", err);
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
      decBtn.innerText = "Unlocking Crypt...";

      try {
        const d = safeBase64ToUint8(h);
        const k = await getKey(p, d.slice(0, 16));
        const out = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: d.slice(16, 28) },
          k,
          d.slice(28),
        );

        document.getElementById("decrypted-output").innerText = dec.decode(out);
        document.getElementById("decrypted-output-container").style.display =
          "block";
        document.getElementById("decrypt-error").style.display = "none";
      } catch (e) {
        document.getElementById("decrypt-error").style.display = "block";
      } finally {
        decBtn.disabled = false;
        decBtn.innerText = prevText;
      }
    },
  };

  const resetToCreateView = () => {
    history.pushState(null, "", "/tools/data");
    const createSec = document.getElementById("create-section");
    const decSec = document.getElementById("decrypt-section");
    const resArea = document.getElementById("result-area");
    const decContainer = document.getElementById("decrypted-output-container");
    const input = document.getElementById("data-input");
    const pass = document.getElementById("data-pass");

    if (createSec) createSec.style.display = "block";
    if (decSec) decSec.style.display = "none";
    if (resArea) resArea.style.display = "none";
    if (decContainer) decContainer.style.display = "none";
    if (input) input.value = "";
    if (pass) pass.value = "";
  };

  const init = () => {
    const eB = document.getElementById("encrypt-btn");
    if (!eB) return;

    eB.onclick = Encrypt.encrypt;
    document.getElementById("decrypt-btn").onclick = Encrypt.decrypt;

    document.getElementById("decrypt-pass").oninput = () => {
      document.getElementById("decrypt-error").style.display = "none";
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

    document.getElementById("copy-Encrypt-btn").onclick = (e) => {
      navigator.clipboard.writeText(
        document.getElementById("Encrypt-result").value,
      );
      e.target.innerText = "Copied";
      setTimeout(() => (e.target.innerText = "Copy"), 2000);
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

    if (window.location.hash.length > 20) {
      document.getElementById("create-section").style.display = "none";
      document.getElementById("decrypt-section").style.display = "block";
    } else {
      document.getElementById("create-section").style.display = "block";
      document.getElementById("decrypt-section").style.display = "none";
    }
  };

  window.addEventListener("hashchange", () => {
    if (window.location.pathname === "/tools/data") init();
  });

  document.addEventListener("spa-content-loaded", init);
  document.addEventListener("DOMContentLoaded", init);
})();
