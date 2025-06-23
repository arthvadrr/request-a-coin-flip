import html from "../../html/requestView.html";
import { supabase } from "../util/supabaseClient.js";
import { copyToClipboard } from "../copyToClipboard.js";
import { showToast } from "../util/toast.js";

async function handleRequestFlip(e) {
  e.target.disabled = true;
  const captchaToken = window.hcaptcha && window.hcaptcha.getResponse();
  console.log("[Captcha] Token before sign-in:", captchaToken);
  if (!captchaToken) {
    showToast("Please complete the captcha.");
    e.target.disabled = false;
    return;
  }
  try {
    /**
     * Captcha sign in
     */
    const { data: userData, error: userError } = await supabase.auth.signInAnonymously({ options: { captchaToken } });
    console.log("[Auth] Result:", userData, userError);
    const userId = userData?.user?.id;
    if (!userId || userError) {
      showToast("Auth failed: " + (userError?.message || "No user ID"));
      if (window.hcaptcha) window.hcaptcha.reset();
      // Do not re-enable the button on error
      return;
    }

    const { data, error, status } = await supabase
      .from("flip-results")
      .insert([{ result: null }])
      .select();

    if (error) {
      console.error("Supabase insert error:", error.message);
      throw error;
    }

    if (!data || !data[0]) {
      if (status === 403) {
        throw new Error("Insert forbidden: check RLS policies and insert permissions.");
      }
      throw new Error("Insert succeeded but no data returned.");
    }

    const flipUrl = `${window.location.origin}${window.location.pathname}?flipid=${data[0].id}`;
    const $div__request_success = document.getElementById("request-success");
    const $copyBtn = document.getElementById("copy-flip-link");
    const $link = document.getElementById("created-flip-link");
    const $id = document.getElementById("created-flip-id");

    $link.textContent = flipUrl;

    if ($id) $id.textContent = data[0].id;

    $div__request_success.classList.add("show");
    $copyBtn.onclick = async () => {
      await copyToClipboard(flipUrl);
      showToast("Link copied!");
    };
  } catch (err) {
    console.error(err);
    const $div__request_error = document.getElementById("request-error");
    $div__request_error.classList.add("show");
    // Do not re-enable the button on error
  } finally {
    if (window.hcaptcha) window.hcaptcha.reset();
  }
}

export function renderRequestView(container) {
  /**
   * Render HTML and update UI
   */
  container.innerHTML = html;

  /**
   * Query DOM elements after rendering
   */
  const requestBtn = document.getElementById("requestFlip");
  if (requestBtn) requestBtn.disabled = true;

  /**
   * Enable button when captcha is solved and remove captcha
   */
  window.onCaptchaSuccess = function () {
    if (requestBtn) requestBtn.disabled = false;
    const captchaDiv = document.querySelector(".h-captcha");
    if (captchaDiv) captchaDiv.remove();
  };

  /**
   * Attach hCaptcha callback
   */
  const captchaDiv = document.querySelector(".h-captcha");
  if (captchaDiv) captchaDiv.setAttribute("data-callback", "onCaptchaSuccess");

  document.getElementById("requestFlip").addEventListener("click", handleRequestFlip);
}
