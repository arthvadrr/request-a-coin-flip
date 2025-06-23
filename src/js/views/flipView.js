import html from "../../html/flipView.html";
import { supabase } from "../util/supabaseClient.js";
import { simulateCoinFlip } from "../util/coinFlip.js";
import { copyToClipboard } from "../copyToClipboard.js";
import { showToast } from "../util/toast.js";

/**
 * Render the flip view, fetch and cache flip data, and handle coin flip logic.
 */
export async function renderFlipView(container, id) {
  window._captchaPassed = false;
  console.log("[flipView] Captcha state reset. Waiting for user to solve captcha.");
  container.innerHTML = html;

  /**
   * Variable declarations
   */
  const STORAGE_KEY = "request-a-coin-flip";
  let cache = {};
  let data = null;

  // Always show captcha and keep button disabled until solved
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    cache = {};
  }

  const flipBtn = document.getElementById("flipCoin");
  const captchaDiv = document.querySelector(".h-captcha");
  if (flipBtn) flipBtn.disabled = true;

  /**
   * Helper to render data to the view
   */
  function renderDataToView(data) {
    if (!window._captchaPassed) {
      console.warn("[flipView] WARNING: Attempted to render data before captcha was solved.");
      return;
    }
    console.log("[flipView] Rendering data to view:", data);
    const coinDiv = document.querySelector(".coin");
    const resultH2 = document.querySelector("#result h2");
    if (!data) return;
    document.getElementById("flip-id").textContent = data.id ?? "—";
    document.getElementById("flip-created").textContent = data.created_at
      ? new Date(data.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "—";
    const expiresText = (() => {
      if (!data.expires_at) return "—";
      if (data.result !== null) return "Completed";
      const expires = new Date(data.expires_at);
      const now = new Date();
      const diffMs = expires - now;
      if (diffMs <= 0) return "Expired";
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins < 1) return "< 1 minute";
      if (diffMins === 1) return "in 1 minute";
      return `in ${diffMins} minutes`;
    })();
    document.getElementById("flip-expires").textContent = expiresText;
    if (flipBtn && expiresText === "Expired") {
      flipBtn.disabled = true;
    }
    if (flipBtn && data.result !== null) {
      flipBtn.disabled = true;
    }
    if (coinDiv && data.result !== null) {
      coinDiv.classList.remove("heads", "tails");
      coinDiv.classList.add(data.result ? "heads" : "tails");
    }
    if (resultH2 && data.result !== null) {
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
    } else if (resultH2) {
      resultH2.textContent = "Pending";
      const shareBtn = document.getElementById("share-result-button");
      if (shareBtn) shareBtn.remove();
    }
  }

  /**
   * Function to fetch from supabase and update cache/UI
   */
  async function fetchFromSupabaseAndRender() {
    console.log("[flipView] Fetching data from Supabase for ID:", id);
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
      // Limit to 10 most recent IDs
      const keys = Object.keys(cache);
      if (keys.length > 10) {
        const oldest = keys.sort((a, b) => {
          const aTime = new Date(cache[a]?.created_at || 0).getTime();
          const bTime = new Date(cache[b]?.created_at || 0).getTime();
          return aTime - bTime;
        });
        for (let i = 0; i < keys.length - 10; i++) {
          delete cache[oldest[i]];
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
      renderDataToView(data);
      // Enable flip button if not expired or already flipped
      const expired = data && data.expires_at && new Date(data.expires_at) - new Date() <= 0;
      const alreadyFlipped = data && data.result !== null;
      if (flipBtn && !expired && !alreadyFlipped) flipBtn.disabled = false;
    } catch (err) {
      console.error("Unexpected error fetching flip result:", err);
      delete cache[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }
  }

  // Always require captcha before showing data
  window.onCaptchaSuccess = function () {
    console.log("[flipView] Captcha solved. Proceeding with rendering.");
    window._captchaPassed = true;
    // After captcha, check local storage for id
    data = cache[id] || null;
    if (data) {
      renderDataToView(data);
      const expired = data && data.expires_at && new Date(data.expires_at) - new Date() <= 0;
      const alreadyFlipped = data && data.result !== null;
      if (flipBtn && !expired && !alreadyFlipped) flipBtn.disabled = false;
      if (captchaDiv) captchaDiv.remove();
    } else {
      // If not in cache, fetch from supabase
      fetchFromSupabaseAndRender();
      if (captchaDiv) captchaDiv.remove();
    }
  };
  if (captchaDiv) captchaDiv.setAttribute("data-callback", "onCaptchaSuccess");

  /**
   * Handle the coin flip button click event.
   */
  async function handleFlipCoin() {
    console.log("[flipView] Flip button clicked.");
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
    // Anonymous sign-in with captcha
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
    if (coinDiv) {
      coinDiv.classList.add(result ? "heads" : "tails");
    }
    if (flipBtn) {
      flipBtn.disabled = true; // Permanently disable after click
    }
    if (resultH2) {
      resultH2.textContent = "Flipping...";
    }

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
        if (resultH2) {
          resultH2.textContent = result ? "Heads" : "Tails";
        }
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

  /**
   * Attach event listener to the flip button
   */
  if (flipBtn) {
    flipBtn.addEventListener("click", handleFlipCoin);
  }
}
