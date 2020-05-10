[![](https://flat.badgen.net/npm/v/searchinghost)](https://www.npmjs.com/package/searchinghost)
[![](https://flat.badgen.net/bundlephobia/minzip/searchinghost?label=gzip%20size)](https://bundlephobia.com/result?p=searchinghost)
[![](https://data.jsdelivr.com/v1/package/npm/searchinghost/badge)](https://www.jsdelivr.com/package/npm/searchinghost)


# SeachinGhost

A pure javascript, lightweight & in-browser full-text search plugin for [Ghost](https://ghost.org/) (blog)


## Description

SearchinGhost is a lightweight and extensible search engine dedicated to the Ghost blogging platform. In its core, it uses
the [Ghost Content API](https://ghost.org/docs/api/v3/javascript/content/) to load your blog content and the powerful
[FlexSearch](https://github.com/nextapps-de/flexsearch) library to index and execute search queries.

Everything happens in the client browser, it helps us to deliver blazing fast search results and displays them
in real-time to your users (a.k.a "search-as-you-type"). We also take care about minimizing network loads by
relying on the browser `localStorage` only sending requests when necessary.


## Demo

Before diving into installation and configuration, give it a try by yourself with this **[Live Demo](https://gmfmi.github.io/searchinGhost/)**.

On this demo, the searchable content comes from the official Ghost demo API (i.e. https://demo.ghost.io).
Options are set to default so each input word is searched into posts title, tags, excerpt and main content.

For example, search the word "marmalade". It does not exist in any post title, exerpt or tag but it is used one time in the "Down The Rabbit Hole" article, that why you will get it as a result.


## Quick Start

First, update the `default.hbs` file of your theme to include an input field and an output element to display the search results. Then, add a link to SearchinGhost script and initialize it with your own `CONTENT_API_KEY`. To get the content API key, please refer to the official [Ghost documentation](https://ghost.org/docs/api/v3/content/#key).

```html
<input id="search-bar">
<ul id="search-results"></ul>

<script src="https://cdn.jsdelivr.net/npm/searchinghost@1.1.0/dist/searchinghost.min.js"></script>
<script>
    var searchinGhost = new SearchinGhost({
        key: 'CONTENT_API_KEY'
    });
</script>
```

That's it, everything is done! If you need a more fine-grained configuration, please read the next sections.


## Installation

You can install SearchinGhost using various methods, here are the possibilities:

1. **From a Content Delivery Network (CDN)**

This is the easiest and prefered method to install SearchinGhost. Add one of these scripts
into your theme `default.hbs`. We also recommand the use of jsdelivr over unpkg for its
reliability and performance.

```html
<script src="https://cdn.jsdelivr.net/npm/searchinghost@1.1.0/dist/searchinghost.min.js"></script>
<!-- OR -->
<script src="https://unpkg.com/searchinghost@1.1.0/dist/searchinghost.min.js"></script>
```

2. **From source**

If you want to serve SearchinGhost from your own server or include it in your build process,
you can get it from the [release page](https://github.com/gmfmi/searchinGhost/releases) assets or
download the `dist/searchinghost.min.js` file.

3. **From NPM**

Install SearchinGhost as a project dependency.

```sh
$ npm install searchinghost
```

Then, load it from any Javascript file.

```js
import SearchinGhost from 'searchinghost';
// OR
var SearchinGhost = require('searchinghost');
```


## Configuration

The only mandatory configuration field is `key`. Any other field has a default value and became optional.

SearchinGhost has been designed to work out of the box, this minimal configuration is yet powerful! At
each key stroke, it will search into posts title, tags, excerpt and content. This is the default behaviour
as it seems to be the most common.

```js
// SearchinGhost minimal configuration
var searchinGhost = new SearchinGhost({
    key: '<CONTENT_API_KEY>'
});
```

Nevertheless, a little bit of extra configuration could be worth it to fit your needs.
Let's say you only want search into the `title` and display the `title` and `published_at`
fields for each post found. You could use this configuration:

```js
var searchinGhost = new SearchinGhost({
    key: '<CONTENT_API_KEY>',
    postsFields: ['title', 'url', 'published_at'],
    postsExtraFields: [],
    postsFormats: [],
    indexedFields: ['title'],
    template: function(post) {
        return `<a href="${post.url}">${post.published_at} - ${post.title}</a>`
    }
});
```

SearchinGhost is easily customizable and extensible through its configuration, take your
time to look into each option from the next section.


## Options

### The complete default configuration

```js
{
    key: '',
    url: window.location.origin,
    version: 'v3',
    loadOn: 'focus',
    searchOn: 'keyup',
    limit: 10,
    inputId: 'search-bar',
    outputId: 'search-results',
    outputChildsType: 'li',
    postsFields: ['title', 'url', 'excerpt', 'custom_excerpt', 'published_at', 'feature_image'],
    postsExtraFields: ['tags'],
    postsFormats: ['plaintext'],
    indexedFields: ['title', 'string_tags', 'excerpt', 'plaintext'],
    template: function(post) {
        var o = `<a href="${post.url}">`
        if (post.feature_image) o += `<img src="${post.feature_image}">`
        o += '<section>'
        if (post.tags.length > 0) {
            o += `<header>
                    <span class="head-tags">${post.tags[0].name}</span>
                    <span class="head-date">${post.published_at}</span>
                  </header>`
        } else {
            o += `<header>
                    <span class="head-tags">UNKNOWN</span>
                    <span class="head-date">${post.published_at}</span>
                  </header>`
        }
        o += `<h2>${post.title}</h2>`
        o += `</section></a>`
        return o;
    },
    emptyTemplate: function() {},
    customProcessing: function(post) {
        if (post.tags) post.string_tags = post.tags.map(o => o.name).join(' ').toLowerCase();
        return post;
    },
    date: {
        locale: document.documentElement.lang || "en-US",
        options: { year: 'numeric', month: 'short', day: 'numeric' }
    },
    cacheMaxAge: 1800,
    onFetchStart: function() {},
    onFetchEnd: function(posts) {},
    onIndexBuildStart: function() {},
    onIndexBuildEnd: function(index) {},
    onSearchStart: function() {},
    onSearchEnd: function(posts) {},
    debug: false
});
```


### All available options

- **key** (string, mandatory)
> The public content API key to get access to blog data.
>
> example: `'22444f78447824223cefc48062'`

- **url** (string)
> The full domaine name of the Ghost API.
>
> default: `window.location.origin`
>
> example: `'https://demo.ghost.io'`

- **version** (string)
> Set the Ghost API version. Work with both `'v2'` and `'v3'`.
>
> default: `'v3'`

- **loadOn** (string)
> Set the library loading strategy. It can be triggered when the HTML page has
> been loaded, on demand when the user click on the search bar or never.
>
> The `'none'` value is only useful if you want to trigger the search bar init
> by yourself. This way, your can call `searchinGhost.loadResources()` when
> the rest of your code is ready.
>
> expected values: `'page'`, `'focus'` or `'none'`
>
> default: `'focus'`

- **searchOn** (string)
> Choose when the search query should be executed. To search at each
> user key stroke and form submit, use `'keyup'`. To search only when the user submit the
> form via a button or entering the 'enter' key, use `'submit'`. If
> you want to have a complete control of it from your own javascript
> code, use `'none'` and execute the search by yourself using
> `searchinGhost.search("...")`.
>
> expected values: `'keyup'`, `'submit'` or `'none'`
>
> default: `'keyup'`

- **limit** (number)
> Set the maximum number of posts returned by a search query. Any value between `1`
> and `50` will be lightning-fast and a values lower than `1000` should not
> degrade performance too much. But remember, when the search engine hits this limit
> it stops digging and return the results: the lower, the better.
>
> default: `10`

- **inputId** (string)
> The HTML `id` param defined on your input search bar.
> Do not include '#' in the name.
>
> default: `'search-bar'`

- **outputId** (string: 'search-results')
> The HTML `id` param defined on your output element. This element should be
> empty in your template, it will be filled with the search results.
>
> default: `'search-results'`

- **outputChildsType** (string)
> Define the HTML type of each returned result. This element will be appended to
> the `outputId` parent element.
> By default, the result element type is a `li` but you can use whatever you want.
> It must be a valid element known by the function `document.createElement()`.
>
> default: `'li'`

- **postsFields** (array of strings)
> An array of all desired posts fields. All these fields will become available
> in the `template` function to display useful posts information.
>
> Refer to the "fields" [official documentation](https://ghost.org/docs/api/v3/content/#fields).
>
> Note: if you use `'custom_excerpt'`, its content will automatically be put in `'excerpt'` to make
> templating easier.
>
> default: `['title', 'url', 'excerpt', 'custom_excerpt', 'published_at', 'feature_image']`

- **postsExtraFields** (array of strings)
> This array allows you to use extra fields like `tags` or `authors`. I personnaly don't know
> why they are not with the other "fields" but the Ghost API is designed this way...
>
> Set its value to `[]` (empty array) to completely disable it.
>
> Refer to the "include" [official documentation](https://ghost.org/docs/api/v3/content/#include).
>
> default: `['tags']`

- **postsFormats** (array of strings)
> This correspond to the "formats" Ghost API which allows use to fetch
> the posts content with HTML or plain text.
>
> Set its value to `[]` (empty array) to completely disable it.
>
> Please refer to the "formats" [official documentation](https://ghost.org/docs/api/v3/content/#formats).
>
> default: `['plaintext']`

- **indexedFields** (array of strings)
> List of indexed fields. The content of all these fields will be searchable.
>
> All value in this list **must** be defined in the posts. Otherwise, the search
> result won't be accurate but the app won't crash! Double check `postsFields`,
> `postsExtraFields` and `postsFormats` values.
>
> *NOTE*: the `'string_tags'` weird field is added in the `customProcessing` option.
> If you want to use tags, this ugly thing is necessary (for now) because FlexSearch
> cannot properly handle arrays. If you do not want/like it, override the `customProcessing`
> to only return `posts` without additionnal modification. If you decide to use tags,
> please also use `'string_tags'` here.
>
> default: `['title', 'string_tags', 'excerpt', 'plaintext']`

- **template** (function)
> Define your own result template. This template will be used for each post found to
> generate the result and appended as child element to the output element. There is
> no templating engine, just a native javascript function using a `post` object as argument.
>
> This template option is lot more powerful than you might expect. We can also think of
> it as a custom processing function called on the search results. For example, if
> you want to do some filtering, return nothing (e.g. `return;`) or an empty string
> (e.g. `return "";`) to discard an item.
>
> Please note the use of **backticks** (e.g. '`') instead of single/double quotes. This
> is required to enable the very useful javascript [variable interpolation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
>
> The available variables are the ones defined in the `postsFields` option.
>
> example:
> ```js
> template: function (post) {
>    return `<a href="${post.url}">#${post.tags} - ${post.published_at} - ${post.title}</a>`
> }
> ```

- **emptyTemplate** (function)
> Define your own result template when there is no result found.
>
> example:
> ```js
> emptyTemplate: function() {
>   return '<p>Sorry, nothing found...</p>'
> }
> ```

- **customProcessing** (function)
> You need to do some extra modification on the posts data fetched from Ghost?
> Use this function to do whatever you need. This function is called on each post,
> executed after the `onFetchEnd()` and before the `onIndexBuildStart()`.
>
> If you want to discard a post, return any JS falsy value (e.g. `null`,
> `undefined`, `false`, `""`, ...).
>
> To easily debug your inputs/outputs, use the `onFetchEnd()` and `onIndexBuildEnd()`
> to display the result with a `console.log()`. If you are a more advanced user, the
> best option is still to use the debugger. Also, do not forget to clean your local
> cache when testing!
>
> *note*: by default, this option is already filled with a helper function to make it
> easier to use the field "tags" in posts. See the `indexedFields` options.
>
> example:
> ```js
> customProcessing: function(post) {
>   post.extra_field = "hello";
>   return post;
> }
> ```

- **date** (object)
> Define the date format fetched from posts.
>
> See the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#Using_options) to get more information.
>
> example:
> ```js
> date: {
>     locale: "fr-FR",
>     options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
> }
> ```

- **cacheMaxAge** (number)
> Set the cache maximum age in seconds. During this amont of time, if an already
> existing index is found in the local storage, it will be loaded without any
> additional HTTP request to confirm its validity. When the cache is purged, the value is reset.
>
> This is espacially useful to save the broadband and network loads of your server. The default
> value is set to half an hour. This value comes from the default user session duration used by
> Google analytics.
>
> default: `1800`

- **onFetchStart** (function)
> Define a callback function before we fetch the data from the Ghost API.
>
> This function takes no argument.
>
> example:
> ```js
> onFetchStart: function() {
>   console.log("before data fetch");
> }
> ```

- **onFetchEnd** (function)
> Define a callback function when the fetch is complete. Even if modifications
> made to `posts` are persisted, we recommand the use of the `customProcessing()`
> function to do so.
>
> The function takes one argument: the array of all posts returned by Ghost itself.
>
> example:
> ```js
> onFetchEnd: function(posts) {
>   console.log("Total posts found on Ghost:", posts.lenght);
> }
> ```

- **onIndexBuildStart** (function)
> Define a callback function before we start building the search index.
>
> The function takes no argument.
>
> example:
> ```js
> onIndexBuildStart: function() {
>   console.log("before building the index");
> }
> ```

- **onIndexBuildEnd** (function)
> Define a callback function when the search index build is complete.
>
> The function takes one argument: the build FlexSearch index object.
>
> example:
> ```js
> onIndexBuildEnd: function(index) {
>   console.log("index built:", index);
> }
> ```

- **onSearchStart** (function)
> Define a callback function before starting to execute the search query. For
> instance, it could be used to hide the results HTML element while waiting for the
> `onSearchEnd` completion or add any fancy transition effects. But in most cases,
> this is not necessary because the search function is fast enough to be nice on eyes.
>
> The function takes no argument.
>
> example:
> ```js
> onSearchStart: function() {
>   console.log("before executing the search query");
> }
> ```

- **onSearchEnd** (function)
> Define a callback function when the search results are ready.
>
> The function takes 1 argument: the array of matching posts.
>
> example:
> ```js
> onSearchEnd: function(posts) {
>   console.log("search complete, posts found:", posts);
> }
> ```

- **debug** (boolean)
> When something is not working as expected, set to `true`
> to display application logs.
>
> default: `false`


## Q&A

### Why use FlexSearch as search engine?

At first, we also tried these other solutions: [Lunr.js](https://github.com/olivernn/lunr.js/),
[minisearch](https://github.com/lucaong/minisearch) and [fuse.js](https://fusejs.io/). At the end,
[FlexSearch](https://github.com/nextapps-de/flexsearch) offered the best overall results with
**fast** and **accurate** results, a **small enough** bundle size and it also was **easy** to
setup/configure. It got everything to be choosen!

### Why my new article do not appear in the search results?

No worries, it is normal. SearchinGhost uses a cache system to store your blog data in the
browser an limit network interaction. By default, cached data stored less than 30 minutes
ago are still considered as valid. After that time, the new article will be available to you.

Keep in mind that other users may **not** need to wait 30 minutes depending on the last time they
did a research. If you was 1h ago, their cache will be purged and renewed so the article will show up.

If you want your users to be always perfectly up to date, set the `cacheMaxAge` to `0`. When doing so,
you should also set `loadOn` to `'focus'` to limit the number of HTTP requests.

### How to display the number of search results found?

Create an HTML element with the ID `"search-counter"` and leverage the `onSearchEnd()` function
to fill it with the result. Here is an example:

```html
<p id="search-counter"></p>
```

```js
onSearchEnd: function(posts) {
    var counterEl = document.getElementById('search-counter');
    counterEl.textContent = `${posts.length} posts found`;
}
```


## Known issues

- [x] Properly handle network errors
- [x] Browser with disabled `localStorage` not supported yet
- [x] Support both Ghost API v2 and v3


## Road map

- [x] Use a logging strategy based on `debug: true`
- [x] Set up a clean build process using Webpack
- [x] Allow user to fetch data when page loads (not only on focus)
- [x] Add callbacks like `onFetchStart()`, `onSearchStart()`, ...
- [x] Use the GhostContentApi official library to give more configuation flexibility (and also support API v2)
- [x] Expose cache max age option to users
- [x] Add an optional empty template result
- [x] Add a custom user-defined post reformat function called before indexation
- [x] Expose 'searchOn' and 'loadOn' in the configuration
- [x] Clean the code and comments
- [x] Make the demo mobile-friendly, it currently looks ugly on small screens
- [ ] An in-depth code review made by a JS guru


## Contribute

Any contribution is more than welcome! If you found a bug or would like to improve the code,
please feel free to create an issue or a PR.

All the code updates must be done under the `src` directory.

To build the project by yourself, run:

```sh
$ npm install
$ npm run build
```

When developping, use the watch command instead, it will rebuild faster at each file modification
and include a link to the source map which make debugging easier.

```sh
$ npm run watch
```

*Note: while creating this project I am using Node v12.16.2 with NPM v6.14.4 but is should also work with older/newer versions*


## Alternative solutions

SearchinGhost is not alone in the field of Ghost search plugins.
Here is a short list of other related projects. You should definitely give
them a try to see if they better fit your needs:


[Ghost Hunter](https://github.com/jamalneufeld/ghostHunter) (v0.6.0 - 101 kB, 26 kB gzip)

> pros:
> - The most famous, a lot of articles and tutorials about it
> - A powerful cache system based on localStorage
> - Full text indexation (not only posts title)
>
> cons:
> - Rely on jQuery
> - Only works with the Ghost v2 API (for now)
> - The source code became messy over time


[Ghost search](https://github.com/HauntedThemes/ghost-search) (v1.1.0 - 12 kB, 4.2 kB gzip)

> pros:
> - Well writen and easy-to-read code base
> - Leverage 'fuzzy' capabilities
>
> cons:
> - Browser lags when searching long words
> - Might send too many API requests
> - Do not use a scoring system to display the best results first

 
[Ghost finder](https://github.com/electronthemes/ghost-finder) (v3.0.1 - 827 kB, 159 kB gzip)

> pros:
> - Pure Javascript library
>
> cons:
> - The incredibly massive final bundle size
> - Send an HTTP request for each key pressed!
> - Do not use a search engine, only look for substrings in posts titles
> - Do not correctly index accentuated characters (e.g. 'é' should be found with 'e')
