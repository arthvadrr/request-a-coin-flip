import html from "../../html/requestView.html";
import { supabase } from "../util/supabaseClient.js";
import { copyToClipboard } from "../copyToClipboard.js";
import { ensureAnonymousLogin } from "../util/auth.js";
import { showToast } from "../util/toast.js";

async function handleRequestFlip(e) {
  e.target.disabled = true;

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId || userError) {
      console.error("User fetch failed:", userError?.message || "No user ID");
      throw new Error("Unable to get authenticated user.");
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
  }
}

export function renderRequestView(container) {
  ensureAnonymousLogin();
  supabase.auth.getUser();
  container.innerHTML = html;
  document.getElementById("requestFlip").addEventListener("click", handleRequestFlip);
}
