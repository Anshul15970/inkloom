// Inkloom Extension Service Worker (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  console.log("Inkloom AI Brand Governance Extension installed.");
});

// Configure Side Panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting side panel behavior:", error));

// Message routing between Content Script and Side Panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACTED_CONTENT") {
    chrome.runtime.sendMessage({
      type: "PAGE_CONTENT_RECEIVED",
      data: message.data
    }).catch(() => {
      // Side panel may not be open yet
    });
    sendResponse({ status: "ACK" });
  }
  return true;
});

