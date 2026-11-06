/**
 * Open a fetched file (resume, etc.) in a new tab via an object URL.
 * Used instead of direct <a href> links to private files, which now require
 * an Authorization header and therefore must be fetched as blobs.
 */
export const openBlobInNewTab = (blob) => {
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    // Popup blocker fallback: simulate a link click instead
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  // Give the browser time to start loading before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
