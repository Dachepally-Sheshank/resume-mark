console.log("ResumeMark Loaded");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {

        chrome.storage.local.set({
            lastVisitedUrl: tab.url
        });

        console.log("Saved:", tab.url);
    }
});
chrome.storage.local.get("lastVisitedUrl", (result) => {
    console.log("Stored URL:", result.lastVisitedUrl);
});