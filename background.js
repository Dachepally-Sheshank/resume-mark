const CONFIG = {
    bookmarkName: "Naruto",
    allowedDomain: "hianimes.se"
};

// Save latest URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === "complete" && tab.url) {

        chrome.storage.local.set({
            lastVisitedUrl: tab.url
        });

        console.log("Saved:", tab.url);
    }
});

// Update bookmark when tab closes
chrome.tabs.onRemoved.addListener(() => {

    chrome.storage.local.get("lastVisitedUrl", (result) => {

        const latestUrl = result.lastVisitedUrl;

        if (!latestUrl) {
            return;
        }

        const url = new URL(latestUrl);

        // Only allow hianime URLs
        if (!url.hostname.includes(CONFIG.allowedDomain)) {

            console.log(
                "Skipped update. Wrong domain:",
                url.hostname
            );

            return;
        }

        chrome.bookmarks.search(
            CONFIG.bookmarkName,
            (results) => {

                if (results.length === 0) {
                    return;
                }

                chrome.bookmarks.update(
                    results[0].id,
                    { url: latestUrl },
                    () => {
                        console.log(
                            "Updated bookmark:",
                            latestUrl
                        );
                    }
                );
            }
        );
    });
});