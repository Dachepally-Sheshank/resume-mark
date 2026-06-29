document.addEventListener("DOMContentLoaded", () => {

    chrome.storage.local.get(
        ["bookmarkName", "domains"],
        (data) => {

            document.getElementById("bookmarkName").value =
                data.bookmarkName || "";

            document.getElementById("domains").value =
                data.domains || "";
        }
    );
});

document.getElementById("saveBtn")
.addEventListener("click", () => {

    const bookmarkName =
        document.getElementById("bookmarkName").value;

    const domains =
        document.getElementById("domains").value;

    chrome.storage.local.set({
        bookmarkName,
        domains
    });

    console.log("Settings saved");
});