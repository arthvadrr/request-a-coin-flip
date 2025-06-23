/*
  This function copies the provided text to the user's clipboard.
*/
export async function copyToClipboard(text) {
  const value = text.trim();

  /*
    Try to use the modern Clipboard API if available
  */
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Fallback if API isn't available
   */
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const copied = document.execCommand("copy");
    return copied;
  } catch (err) {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
