function isGoodUrl(urlString) {

    try {

        const url = new URL(urlString);

        return (
            url.pathname.includes("/watch/")
        );

    } catch {

        return false;
    }
}
console.log("ResumeMark v0.3.1 Loaded");

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
            ["bookmarkId", "domains"],
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

    session.lastGoodUrl = tab.url;

    await setSession(session);

    console.log(
        "Updated lastGoodUrl:",
        tab.url
    );
}

    await setTabState(tabUrls);

    console.log("Stored:", tabId, tab.url);
});

// --------------------
// TAB CLOSED → PROCESS
// --------------------

chrome.tabs.onRemoved.addListener(async (tabId) => {

    console.log("Tab closed:", tabId);

    const tabUrls = await getTabState();
    const latestUrl = tabUrls[tabId];

    console.log("Latest URL:", latestUrl);

    if (!latestUrl) return;

    const config = await getConfig();

    const bookmarkId = config.bookmarkId;

    if (!bookmarkId) {
        console.log("No bookmark selected");
        return;
    }

    // --------------------
    // RULE ENGINE
    // --------------------

    let url;

    try {
        url = new URL(latestUrl);
    } catch {
        return;
    }

    const allowedDomains = (config.domains || "")
        .split(",")
        .map(d => d.trim())
        .filter(Boolean);

    const isAllowed =
        allowedDomains.length === 0 ||
        allowedDomains.some(domain =>
            url.hostname.includes(domain)
        );

    if (!isAllowed) {
        console.log("Blocked domain:", url.hostname);
        delete tabUrls[tabId];
        await setTabState(tabUrls);
        return;
    }

    // --------------------
    // ACTION
    // --------------------

    const session = await getSession();

const resumeUrl =
    session?.lastGoodUrl || latestUrl;

chrome.bookmarks.update(
    bookmarkId,
    { url: resumeUrl },
        async () => {

            console.log("Bookmark updated:", latestUrl);

            delete tabUrls[tabId];
            await setTabState(tabUrls);
        }
    );
});