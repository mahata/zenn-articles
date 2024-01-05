---
title: A Chrome extension for Startpage.com which adds search queries to the tab title
description: A Chrome extension for Startpage.com which adds search queries to the tab title
tags: ["Search", "Startpage", "Chrome"]
published: true
---

The advent of ChatGPT has significantly reduced the use of conventional web searches. However, since ChatGPT doesn't possess new knowledge, I occasionally use search engines to obtain the latest information.

I use [Startpage](https://www.startpage.com/) as my search engine. It is advertised as "The world's most private search engine." According to [their own description](https://www.startpage.com/en/how-startpage-works/), they return search results without retaining any user information. A similar service with higher recognition is [DuckDuckGo](https://duckduckgo.com/).

I personally think that the search quality of DuckDuckGo is "not very good." DuckDuckGo uses Bing as its backend search engine, but I find Bing's search results somewhat inferior compared to Google, especially when searching for information in languages except English.

When using Startpage as it is, I encounter a problem: it's hard to distinguish between multiple search result pages. For instance, suppose you have three tabs open with searches for "Startpage," "DuckDuckGo," and "Google." In Google Chrome, they appear as follows:

![Startpage without Chrome extension](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/t6lfsgsegrq5hszrrgdd.gif)

Repeated searches can make it unclear which tab contains which search results.

I believe this is an intentional design by Startpage. Common search engines include the search query in the URL parameters, like `?q=search-query`. Startpage receives search queries via POST requests, making it impossible to discern the search query from the URL. Similarly, not including the search query in the page title is likely a consideration to protect privacy even if someone peeks at your browser.

However, this compromises usability, which I personally find unbearable. To solve this, I created the [Startpage Nicer Title Extension, a Chrome Extension](https://chromewebstore.google.com/u/1/detail/startpage-nicer-title-ext/bnmehmalocfmlifckddiolikhcdkaifa). With this installed, the tabs look like this:

![Startpage with Nicer Title Chrome extension](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/f8ouj4rbfwccbwvwpwtg.gif)


Can you see the difference? The search keywords are prefixed to the tabs. This makes it easier to distinguish between multiple search results in the browser.

[The source code for this Chrome extension is available on GitHub](https://github.com/mahata/startpage-chrome-extension). Speaking technically... there's not much to say. As of writing this article, the entirety of the code is the 5 lines in `scripts/content.js`:

```javascript
const searchBox = document.getElementById('q');

if (searchBox && searchBox.value.trim() !== "") {
    document.title = searchBox.value + " - StartPage";
}
```

The search box `<input />` in Startpage has an `id="q"`, so the code just retrieves its value and stuffs it into `document.title`. It's a short code, but I think it's amazing that something meaningful can be created with just this.

If you use a Chromium-based browser and are interested in Startpage, please try the Startpage Nicer Title Extension.
