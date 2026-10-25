// Inkloom Content Script: CMS DOM Extractor & Inline Governance Overlay
(function () {
  console.log("Inkloom content script active on:", window.location.hostname);

  function getActiveEditorContent() {
    // 1. Check for active selection
    const selection = window.getSelection().toString();
    if (selection && selection.trim().length > 10) {
      return selection.trim();
    }

    // 2. Check for focused editor
    const activeEl = document.activeElement;
    if (activeEl) {
      if (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT") {
        return activeEl.value;
      }
      if (activeEl.isContentEditable) {
        return activeEl.innerText;
      }
    }

    // 3. Fallback: Search common CMS rich text editor containers
    const commonSelectors = [
      '[contenteditable="true"]',
      ".editor-styles-wrapper", // WordPress Gutenberg
      ".ql-editor",             // Quill
      ".ProseMirror",           // ProseMirror / Notion-like
      ".notion-page-content",
      ".msg-form__contenteditable", // LinkedIn
    ];

    for (const selector of commonSelectors) {
      const el = document.querySelector(selector);
      if (el && el.innerText && el.innerText.trim().length > 10) {
        return el.innerText.trim();
      }
    }

    return "";
  }

  // Listen for extraction requests from side panel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "REQUEST_PAGE_CONTENT") {
      const text = getActiveEditorContent();
      sendResponse({
        text: text,
        url: window.location.href,
        hostname: window.location.hostname,
      });
    }
    return true;
  });
})();
