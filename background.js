const WORKER_ID = Date.now();

console.log("Worker started:", WORKER_ID);
console.log("ResumeMark v0.2 Loaded");

function getConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            ["bookmarkName", "domains"],
            (result) => {
                resolve(result);
            }
        );
    });
}

// Track tab URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (
        changeInfo.status === "complete" &&
        tab.url
    ) {

        // Ignore Chrome internal pages
        if (tab.url.startsWith("chrome://")) {
            return;
        }

        chrome.storage.local.get(
            ["tabUrls"],
            (result) => {

                const tabUrls =
                    result.tabUrls || {};

                tabUrls[tabId] = tab.url;

                chrome.storage.local.set({
                    tabUrls
                });

                console.log(
                    "Stored Tab",
                    tabId,
                    "->",
                    tab.url
                );
            }
        );
    }
});

// Tab closed
chrome.tabs.onRemoved.addListener(async (tabId) => {

    console.log("Tab closed:", tabId);

    const data =
        await chrome.storage.local.get(
            "tabUrls"
        );

    const tabUrls =
        data.tabUrls || {};

    console.log("Stored tabUrls:", tabUrls);
    console.log("Closing tab:", tabId);

    const latestUrl =
        tabUrls[tabId];

    console.log("Latest URL:", latestUrl);

    if (!latestUrl) {
        console.log("No URL found for tab");
        return;
    }

    const config =
        await getConfig();

    console.log("Config:", config);

    const bookmarkName =
        config.bookmarkName;

    const allowedDomains =
        (config.domains || "")
            .split(",")
            .map(d => d.trim())
            .filter(Boolean);

    const url =
        new URL(latestUrl);

    const isAllowed =
        allowedDomains.some(domain =>
            url.hostname.includes(domain)
        );

    if (!isAllowed) {

        console.log(
            "Skipped update:",
            url.hostname
        );

        delete tabUrls[tabId];

        chrome.storage.local.set({
            tabUrls
        });

        return;
    }

    chrome.bookmarks.search(
        bookmarkName,
        (results) => {

            if (results.length === 0) {

                console.log(
                    "Bookmark not found:",
                    bookmarkName
                );

                return;
            }

            chrome.bookmarks.update(
                results[0].id,
                {
                    url: latestUrl
                },
                () => {

                    console.log(
                        "Bookmark Updated:",
                        latestUrl
                    );

                    delete tabUrls[tabId];

                    chrome.storage.local.set({
                        tabUrls
                    });
                }
            );
        }
    );
});