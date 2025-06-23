import html from "../../html/flipView.html";
import { supabase } from "../util/supabaseClient.js";
import { simulateCoinFlip } from "../util/coinFlip.js";
import { copyToClipboard } from "../copyToClipboard.js";
import { showToast } from "../util/toast.js";
import { ensureAnonymousLogin } from "../util/auth.js";

/**
 * Render the flip view, fetch and cache flip data, and handle coin flip logic.
 */
export async function renderFlipView(container, id) {
  await ensureAnonymousLogin();
  /**
   * Variable declarations
   */
  const STORAGE_KEY = "request-a-coin-flip";
  let cache = {};
  let data = null;

  /**
   * Load or initialize the persistent cache object
   */
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    cache = {};
  }

  /**
   * Try to get data from cache
   */
  data = cache[id] || null;

  /**
   * If no cached data, fetch from supabase
   */
  if (!data) {
    try {
      const { data: fetched, error } = await supabase.from("flip-results").select("*").eq("id", id).single();
      if (error || !fetched) {
        console.error("Error fetching flip result:", error?.message);
        delete cache[id];
      } else {
        data = fetched;
        cache[id] = data;

        /**
         * Limit to 10 most recent IDs
         */
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
      }
    } catch (err) {
      console.error("Unexpected error fetching flip result:", err);
      delete cache[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    }
  }

  /**
   * Render HTML and update UI with data
   */
  container.innerHTML = html;
  const flipBtn = document.getElementById("flipCoin");
  const coinDiv = document.querySelector(".coin");
  const resultH2 = document.querySelector("#result h2");

  if (data) {
    document.getElementById("flip-id").textContent = data.id ?? "—";
    // Human readable local time for created_at
    document.getElementById("flip-created").textContent = data.created_at
      ? new Date(data.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
      : "—";
    // Expiry as relative time (e.g. "in 10 minutes")
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

    /**
     * Disable flip button if expired
     */
    if (flipBtn && expiresText === "Expired") {
      flipBtn.disabled = true;
    }
    /**
     * Disable the flip button if already flipped
     */
    if (flipBtn) {
      flipBtn.disabled = data.result !== null;
    }
    /**
     * Set coin and result if already flipped
     */
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

        /**
         * Home link
         */
        let homeLink = document.createElement("a");
        homeLink.href = window.location.pathname;
        homeLink.className = "home-link";
        homeLink.textContent = "Request another coin flip";
        shareBtn.insertAdjacentElement("afterend", homeLink);
      }
    } else if (resultH2) {
      resultH2.textContent = "Pending";
      const shareBtn = document.getElementById("share-result-btn");
      if (shareBtn) shareBtn.remove();
    }
  }

  /**
   * Handle the coin flip button click event.
   */
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

    const result = simulateCoinFlip();

    if (coinDiv) {
      coinDiv.classList.add(result ? "heads" : "tails");
    }
    if (flipBtn) {
      flipBtn.disabled = true;
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

      /**
       * Update cache and UI with the new result
       */
      data.result = result;
      cache[id] = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));

      setTimeout(() => {
        if (resultH2) {
          resultH2.textContent = result ? "Heads" : "Tails";
        }
        document.getElementById("result").classList.add("has-result");
        // Add share button if not already present after flip
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
