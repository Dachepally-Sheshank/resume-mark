function extractContentKey(urlString) {

    try {

        const url = new URL(urlString);

        if (!url.pathname.includes("/watch/")) {
            return null;
        }

        const slug =
            url.pathname.split("/watch/")[1];

        if (!slug.includes("-episode-")) {
            return null;
        }

        return slug.split("-episode-")[0];

    } catch {

        return null;
    }
}

function isGoodUrl(urlString) {

    try {

        const url = new URL(urlString);

        return url.pathname.includes("/watch/");

    } catch {

        return false;
    }
}

console.log("ResumeMark v0.4 Loaded");

// --------------------
// STATE HELPERS
// --------------------

function getTabState() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["tabUrls"], (res) => {
            resolve(res.tabUrls || {});
        });
    });
}

function setTabState(tabUrls) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ tabUrls }, resolve);
    });
}

function getConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(
    ["bookmarkId"],
    (res) => resolve(res)
);
    });
}

function getSession() {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            ["activeSession"],
            (res) => resolve(res.activeSession || null)
        );
    });
}

function setSession(session) {
    return new Promise((resolve) => {
        chrome.storage.local.set(
            { activeSession: session },
            resolve
        );
    });
}

// --------------------
// TRACK TAB UPDATES
// --------------------

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    if (changeInfo.status !== "complete") return;
    if (!tab.url || tab.url.startsWith("chrome://")) return;

    const tabUrls = await getTabState();

    tabUrls[tabId] = tab.url;

    const session = await getSession();

    if (
        session &&
        isGoodUrl(tab.url)
    ) {

        const currentKey =
            extractContentKey(tab.url);

        if (
            currentKey &&
            currentKey === session.contentKey
        ) {

            session.lastGoodUrl = tab.url;

            await setSession(session);

            console.log(
                "Progress Updated:",
                currentKey
            );

        } else {

            console.log(
                "Ignored Different Content:",
                currentKey
            );
        }
    }

    await setTabState(tabUrls);

    console.log(
        "Stored:",
        tabId,
        tab.url
    );
});

// --------------------
// TAB CLOSED → PROCESS
// --------------------

chrome.tabs.onRemoved.addListener(async (tabId) => {

    console.log("Tab closed:", tabId);

    const tabUrls = await getTabState();

    const latestUrl = tabUrls[tabId];

    console.log(
        "Latest URL:",
        latestUrl
    );

    if (!latestUrl) {
        return;
    }

    const config = await getConfig();

    const bookmarkId =
        config.bookmarkId;

    if (!bookmarkId) {

        console.log(
            "No bookmark selected"
        );

        return;
    }

    // --------------------
    // UPDATE BOOKMARK
    // --------------------

    const session =
        await getSession();

    const resumeUrl =
        session?.lastGoodUrl ||
        latestUrl;

    chrome.bookmarks.update(
        bookmarkId,
        { url: resumeUrl },
        async () => {

            console.log(
                "Bookmark updated:",
                resumeUrl
            );

            delete tabUrls[tabId];

            await setTabState(tabUrls);
        }
    );
});