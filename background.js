console.log("ResumeMark Loaded");

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("Visited:", tab.url);
    }
});