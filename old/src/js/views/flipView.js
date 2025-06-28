import html from "../../html/flipView.html";
import { supabase } from "../util/supabaseClient.js";
import { simulateCoinFlip } from "../util/coinFlip.js";
import { copyToClipboard } from "../copyToClipboard.js";
import { showToast } from "../util/toast.js";

export async function renderFlipView(container, id) {
  window._captchaPassed = false;
  container.innerHTML = html;

  const STORAGE_KEY = "request-a-coin-flip";
  let cache = {};
  let data = null;

  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    cache = {};
  }

  const flipBtn = document.getElementById("flipCoin");
  const captchaDiv = document.querySelector(".h-captcha");
  if (flipBtn) flipBtn.disabled = true;

  function renderDataToView(data) {
    if (!window._captchaPassed || !data) {
      console.log("[flipView] renderDataToView: Captcha not passed or no data", {
        captcha: window._captchaPassed,
        data,
      });
      return;
    }
    document.getElementById("flip-id").textContent = data.id ?? "—";
    document.getElementById("flip-created").textContent = data.created_at
      ? new Date(data.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "—";
    const expiresText = (() => {
      if (!data.expires_at) return "—";
      if (data.result !== null) return "Completed";
      const diffMs = new Date(data.expires_at) - new Date();
      if (diffMs <= 0) return "Expired";
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins < 1) return "< 1 minute";
      if (diffMins === 1) return "in 1 minute";
      return `in ${diffMins} minutes`;
    })();
    document.getElementById("flip-expires").textContent = expiresText;
    if (flipBtn) {
      if (expiresText === "Expired" || data.result !== null) {
        flipBtn.setAttribute("disabled", "disabled");
        console.log("[flipView] renderDataToView: Button should be disabled", { expiresText, result: data.result });
      } else {
        flipBtn.removeAttribute("disabled");
        console.log("[flipView] renderDataToView: Button should be enabled, removed disabled attribute", {
          expiresText,
          result: data.result,
          flipBtn,
        });
      }
      console.log("[flipView] renderDataToView: Button state after update", {
        disabled: flipBtn.hasAttribute("disabled"),
        flipBtn,
      });
    } else {
      console.log("[flipView] renderDataToView: No flipBtn found");
    }
    const coinDiv = document.querySelector(".coin");
    const resultH2 = document.querySelector("#result h2");
    if (coinDiv && data.result !== null) {
      coinDiv.classList.remove("heads", "tails");
      coinDiv.classList.add(data.result ? "heads" : "tails");
    }
    if (resultH2) {
      if (data.result !== null) {
        resultH2.textContent = data.result ? "Heads" : "Tails";
        document.getElementById("result").classList.add("has-result");
        let shareBtn = document.getElementById("share-result-button");
        if (!shareBtn) {
          shareBtn = document.createElement("button");
          shareBtn.id = "share-result-button";
          shareBtn.className = "button";
          shareBtn.setAttribute("aria-label", "Share result");
          shareBtn.innerHTML = `<svg class="icon icon-share"><use href="#icon-share"></use></svg>Share the result!`;
          resultH2.parentNode.appendChild(shareBtn);
          shareBtn.addEventListener("click", async () => {
            try {
              await copyToClipboard(window.location.href);
              showToast("Result link copied!");
            } catch (e) {
              showToast("Failed to copy link");
            }
          });
          let homeLink = document.createElement("a");
          homeLink.href = window.location.pathname;
          homeLink.className = "home-link";
          homeLink.textContent = "Request another coin flip";
          shareBtn.insertAdjacentElement("afterend", homeLink);
        }
      } else {
        resultH2.textContent = "Pending";
        const shareBtn = document.getElementById("share-result-button");
        if (shareBtn) shareBtn.remove();
      }
    }
  }

  async function fetchFromSupabaseAndRender() {
    try {
      const { data: fetched, error } = await supabase.from("flip-results").select("*").eq("id", id).single();
      if (error || !fetched) {
        console.error("Error fetching flip result:", error?.message);
        delete cache[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        return;
      }
      data = fetched;
      cache[id] = data;
      const keys = Object.keys(cache);
      if (keys.length > 10) {
        const oldest = keys.sort((a, b) => new Date(cache[a]?.created_at || 0) - new Date(cache[b]?.created_at || 0));
        for (let i = 0; i < keys.length - 10; i++) delete cache[oldest[i]];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      renderDataToView(data);
    } catch (err) {
      console.error("Unexpected error fetching flip result:", err);
      delete cache[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }
  }

  window.onCaptchaSuccess = function () {
    window._captchaPassed = true;
    data = cache[id] || null;
    console.log("[flipView] onCaptchaSuccess: Captcha solved, data:", data);
    if (data) {
      renderDataToView(data);
    } else {
      fetchFromSupabaseAndRender(); // fetchFromSupabaseAndRender will call renderDataToView when data is ready
    }
    if (captchaDiv) captchaDiv.remove();
  };
  if (captchaDiv) captchaDiv.setAttribute("data-callback", "onCaptchaSuccess");

  async function handleFlipCoin() {
    if (!data || data.result !== null) {
      if (flipBtn) flipBtn.disabled = true;
      return;
    }
    const captchaToken = window.hcaptcha && window.hcaptcha.getResponse();
    if (!captchaToken) {
      showToast("Please complete the captcha.");
      if (flipBtn) flipBtn.disabled = false;
      return;
    }
    const { data: userData, error: userError } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
    if (!userData?.user?.id || userError) {
      showToast("Auth failed: " + (userError?.message || "No user ID"));
      if (window.hcaptcha) window.hcaptcha.reset();
      if (flipBtn) flipBtn.disabled = true;
      return;
    }
    if (window.hcaptcha) window.hcaptcha.reset();

    const result = simulateCoinFlip();
    const coinDiv = document.querySelector(".coin");
    const resultH2 = document.querySelector("#result h2");
    if (coinDiv) coinDiv.classList.add(result ? "heads" : "tails");
    if (flipBtn) flipBtn.disabled = true;
    if (resultH2) resultH2.textContent = "Flipping...";

    try {
      const { data: updated, error } = await supabase.from("flip-results").update({ result }).eq("id", id).select();
      if (error) {
        console.error("Error updating flip result:", error.message);
        return;
      }
      data.result = result;
      cache[id] = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      setTimeout(() => {
        if (resultH2) resultH2.textContent = result ? "Heads" : "Tails";
        document.getElementById("result").classList.add("has-result");
        let shareBtn = document.getElementById("share-result-button");
        if (!shareBtn) {
          shareBtn = document.createElement("button");
          shareBtn.id = "share-result-button";
          shareBtn.className = "button";
          shareBtn.setAttribute("aria-label", "Share result");
          shareBtn.innerHTML = `<svg class="icon icon-share"><use href="#icon-share"></use></svg>Share the result!`;
          if (resultH2 && resultH2.parentNode) {
            resultH2.parentNode.appendChild(shareBtn);
          } else {
            document.getElementById("result").appendChild(shareBtn);
          }
          shareBtn.addEventListener("click", async () => {
            try {
              await copyToClipboard(window.location.href);
              showToast("Result link copied!");
            } catch (e) {
              showToast("Failed to copy link");
            }
          });
        }
      }, 3000);
    } catch (err) {
      console.error("Unexpected error updating flip result:", err);
    } finally {
      if (window.hcaptcha) window.hcaptcha.reset();
    }
  }

  if (flipBtn) flipBtn.addEventListener("click", handleFlipCoin);
}
