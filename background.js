const BOOKMARK_NAME = "Naruto";

// Save latest URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {

        chrome.storage.local.set({
            lastVisitedUrl: tab.url
        });

        console.log("Saved:", tab.url);
    }
});

// When tab closes
chrome.tabs.onRemoved.addListener(() => {

    chrome.storage.local.get("lastVisitedUrl", (result) => {

        const latestUrl = result.lastVisitedUrl;

        if (!latestUrl) {
            console.log("No URL stored");
            return;
        }

        chrome.bookmarks.search(BOOKMARK_NAME, (results) => {

            if (results.length === 0) {
                console.log("Bookmark not found");
                return;
            }

            const bookmark = results[0];

            chrome.bookmarks.update(
                bookmark.id,
                { url: latestUrl },
                () => {
                    console.log(
                        "Updated bookmark to:",
                        latestUrl
                    );
                }
            );
        });
    });
});