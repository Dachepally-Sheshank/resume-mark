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
document.addEventListener("DOMContentLoaded", async () => {

    const select = document.getElementById("bookmarkSelect");

    chrome.bookmarks.getTree((tree) => {

        const bookmarks = [];

        function traverse(nodes) {
            for (const node of nodes) {

                if (node.url) {
                    bookmarks.push(node);
                }

                if (node.children) {
                    traverse(node.children);
                }
            }
        }

        traverse(tree);

        bookmarks.forEach(bm => {
            const option = document.createElement("option");
            option.value = bm.id;
            option.textContent = bm.title;
            select.appendChild(option);
        });

        chrome.storage.local.get(["bookmarkId"], (data) => {
            if (data.bookmarkId) {
                select.value = data.bookmarkId;
            }
        });
    });
});

document.getElementById("saveBtn").addEventListener("click", () => {

    const bookmarkId =
        document.getElementById("bookmarkSelect").value;

    chrome.bookmarks.get(
        bookmarkId,
        (bookmarks) => {

            if (!bookmarks.length) {
                return;
            }

            const bookmark = bookmarks[0];

            chrome.storage.local.set({

                bookmarkId,

                activeSession: {
    bookmarkId,

    contentKey:
        extractContentKey(bookmark.url),

    startUrl: bookmark.url,

    lastGoodUrl: bookmark.url
}

            }, () => {

                console.log(
                    "Session Started:",
                    bookmark.url
                );

            });

        }
    );
});
