[![](https://flat.badgen.net/npm/v/searchinghost)](https://www.npmjs.com/package/searchinghost)
[![](https://flat.badgen.net/bundlephobia/minzip/searchinghost?label=gzip%20size)](https://bundlephobia.com/result?p=searchinghost)
[![](https://data.jsdelivr.com/v1/package/npm/searchinghost/badge)](https://www.jsdelivr.com/package/npm/searchinghost)


# SearchinGhost

A pure javascript, lightweight & in-browser full-text search plugin for [Ghost](https://ghost.org/) (blog)


## Description

SearchinGhost is a lightweight and extensible search engine dedicated to the Ghost blogging platform. In its core, it uses
the [Ghost Content API](https://ghost.org/docs/api/v3/content/) to load your blog content and the powerful
[FlexSearch](https://github.com/nextapps-de/flexsearch) library to index and execute search queries.

Everything happens in the client browser, it helps us to deliver blazing fast search results and displays them
in real-time to your users (a.k.a "search-as-you-type"). We also take care about minimizing network loads by
relying on the browser `localStorage` only sending requests when necessary.

You blog is in Cyrillic, Chinese, Korean, Greek, Indian or any other non-latin language? No worries, it is supported, see the [dedicated section](#language-settings).

*__BONUS__: if you like the concept but you would like to install it quickly and easily (in less than 3 minutes, really!), please visit the [SearchinGhostEasy project](https://github.com/gmfmi/searchinghost-easy).*


## Demo

Before diving into installation and configuration, give it a try by yourself with this **[Live Demo](https://gmfmi.github.io/searchinGhost/)**.

On this demo, the searchable content comes from the official Ghost demo API (i.e. https://demo.ghost.io).
Options are set to default so each input word is searched into posts title, tags, excerpt and main content.

For example, search the word "marmalade". It does not exist in any post title, excerpt or tag but it is used one time in the "Down The Rabbit Hole" article, that why you will get it as a result.


## Quick Start

First, update the `default.hbs` file of your theme to include an input field and an output element to display the search results. Then, add a link to SearchinGhost script and initialize it with your own `CONTENT_API_KEY`. To get the content API key, please refer to the official [Ghost documentation](https://ghost.org/docs/api/v3/content/#key).

```html
<input id="search-bar">
<ul id="search-results"></ul>

<script src="https://cdn.jsdelivr.net/npm/searchinghost@1.6.0/dist/searchinghost.min.js"></script>
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

This is the easiest and preferred method to install SearchinGhost. Add one of these scripts
into your theme `default.hbs`. We also recommend the use of jsdelivr over unpkg for its
reliability and performance.

```html
<script src="https://cdn.jsdelivr.net/npm/searchinghost@1.6.0/dist/searchinghost.min.js"></script>
<!-- OR -->
<script src="https://unpkg.com/searchinghost@1.6.0/dist/searchinghost.min.js"></script>
```

2. **From source**

If you want to serve SearchinGhost from your own server or include it in your build process,
you can get it from the [release page](https://github.com/gmfmi/searchinGhost/releases) assets or
download the `dist/searchinghost.min.js` file.

3. **From NPM**

Install SearchinGhost as a project dependency.

```shell
$ npm install searchinghost
# OR
$ yarn add searchinghost
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
    inputId: ['search-bar'],
    outputId: ['search-results'],
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
    indexOptions: {},
    searchOptions: {},
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
> example: `'https://demo.ghost.io'`
>
> default: `window.location.origin`

- **version** (string)
> Set the Ghost API version. Work with both `'v2'` and `'v3'`.
>
> default: `'v3'`

- **loadOn** (string)
> Set the library loading strategy. It can be triggered when the HTML page has
> been loaded, on demand when the user click on the search bar or never.
>
> To trigger the search bar initialization by yourself, set this value to `false` (boolean).
> This way, your can call `searchinGhost.loadData()` when the rest of your code is ready.
>
> expected values: `'page'`, `'focus'` or `false`
>
> default: `'focus'`

- **searchOn** (string)
> Choose when the search query should be executed. To search at each
> user key stroke and form submit, use `'keyup'`. To search only when the user submit the
> form via a button or entering the 'enter' key, use `'submit'`. If
> you want to have a complete control of it from your own javascript
> code, use `false` (boolean) and execute the search by yourself using
> `searchinGhost.search("...")`.
>
> expected values: `'keyup'`, `'submit'` or `false`
>
> default: `'keyup'`

- **limit** (number)
> Set the maximum number of posts returned by a search query. Any value between `1`
> and `50` will be lightning-fast and a values lower than `1000` should not
> degrade performance too much. But remember, when the search engine hits this limit
> it stops digging and return the results: the lower, the better.
>
> Even though it is strongly discouraged, set this value to `0` to display all the available results.
>
> default: `10`

- **inputId** (array of string)
> \[Deprecated] Before `v1.6.0`, this field was a `string`, this behaviour has been deprecated.
>
> Your website may have one or several search bars, each of them must have a unique
> HTML `id` attribute. Put each search bar  `id` in this array.
> Do not include '#' in the name.
>
> If you do not need any input field, set the value to `[]` (empty array) and also set `searchOn`
> to `false` (boolean). Then, run a search using `searchinGhost.search("<your query>")`.
>
> default: `['search-bar']`

- **outputId** (array of string)
> \[Deprecated] Before `v1.6.0`, this field was a `string`, this behaviour has been deprecated.
>
> Your website can use one or more HTML elements to display the search results.
> This array reference all these output element's `id` attribute.
> If any of these elements has already a content, it will be overwritten by
> the search results.
>
> If you are using a JS framework to display the search results, set this value to
> `[]` (empty array). You will get the posts found as the value returned by the
> function `searchinGhost.search("<your query>")`.
>
> default: `['search-results']`

- **outputChildsType** (string)
> \[Deprecated] Before the `v1.6.0`, this fields was a `string`. this has been deprecated.
>
> Each search result is wrapped inside a child element before being added to the
> `outputId` parent element. The default type is `li` but you can set it to any
> valid HTML element (see [MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element)).
>
> If you do not want to use a wrapping element to directly append the results of
> `template` and `emptyTemplate` to the output element, set the value to `false` (boolean).
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
> This array allows you to use extra fields like `tags` or `authors`. I personally don't know
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
> to only return `posts` without additional modification. If you decide to use tags,
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
> This is especially useful to save the broadband and network loads of your server. The default
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
> made to `posts` are persisted, we recommend the use of the `customProcessing()`
> function to do so.
>
> The function takes one argument: the array of all posts returned by Ghost itself.
>
> example:
> ```js
> onFetchEnd: function(posts) {
>   console.log("Total posts found on Ghost:", posts.length);
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

- **indexOptions** (object)
> Add extra search index configuration or override the default ones. These options will
> be merge with the already provided one:
> ```js
> {
>     doc: {
>         id: "id",
>         field: this.config.indexedFields
>     },
>     encode: "simple",
>     tokenize: "forward",
>     threshold: 0,
>     resolution: 4,
>     depth: 0
> }
> ```
>
> Also use this parameter to enable non-latin language support, see [this section](#language-settings).
>
> default: `{}`

- **searchOptions** (object)
> Made for advanced users, allows you to fine tune the search queries.
> Refer to [this](https://github.com/nextapps-de/flexsearch/tree/0.6.22#custom-search) FlexSearch documentation.
>
> We use this specific query construction: `index.search("your query", searchOptions)` so anything added
> to `searchOptions` will be passed to FlexSearch this way.
>
> This parameter can be really handy when filtering posts based on a tag. As an example:
> ```js
> searchOptions: {
>     where: {
>         string_tags: "getting started"
>     }
> }
> ```
>
> Also note that the `limit` Searchinghost option is automatically merged into the `searchOptions`. In our case, it
> would finally become:
> ```js
> searchOptions: {
>     where: {
>         string_tags: "getting started"
>     },
>     limit: 10
> }
> ```
>
> default: `{}`

- **debug** (boolean)
> When something is not working as expected, set to `true`
> to display application logs.
>
> default: `false`


## Language settings

If your blog uses a latin alphabet language (e.g. English, French, Spanish) or a Northern/Eastern European one (e.g. German, Swedish, Hungarian, Slovenian, Estonian) the default configuration will work just fine. In the other cases, find the appropriate `indexOptions` value and add it to your main SearchinGhost configuration.

To create your own specific settings, refer to the
[FlexSearch README](https://github.com/nextapps-de/flexsearch/tree/0.6.22#add-custom-matcher) and
[these](https://github.com/nextapps-de/flexsearch/issues/51)
[three](https://github.com/nextapps-de/flexsearch/issues/51)
[issues](https://github.com/nextapps-de/flexsearch/issues/73).

If nothing works for you or if the resulting behaviour is not correct, feel free to [create an issue](https://github.com/gmfmi/searchinGhost/issues).

### Arabic

```js
indexOptions: {
    encode: false,
    rtl: true,
    split: /\s+/
}
```

### Chinese, Korean, Japanese

```js
indexOptions: {
    encode: false,
    tokenize: function(str){
        return str.replace(/[\x00-\x7F]/g, "").split("");
    }
}
```

### Cyrillic, Indian, Sinhala

This option can be used by any space-separated word languages that uses complex characters.

```js
indexOptions: {
    encode: false,
    split: /\s+/
}
```

### Mixed language types

If you need to use multiple language types (e.g. Cyrillic/English or Indian/Spanish), use the dedicated
configuration below. I know, it can look scary at first look but just copy/paste it and trust me.

```js
indexOptions: {
    split: /\s+/,
    encode: function(str) {
        var regexp_replacements = {
            "a": /[àáâãäå]/g,
            "e": /[èéêë]/g,
            "i": /[ìíîï]/g,
            "o": /[òóôõöő]/g,
            "u": /[ùúûüű]/g,
            "y": /[ýŷÿ]/g,
            "n": /ñ/g,
            "c": /[ç]/g,
            "s": /ß/g,
            " ": /[-/]/g,
            "": /['!"#$%&\\()\*+,-./:;<=>?@[\]^_`{|}~]/g,
            " ": /\s+/g,
        }
        str = str.toLowerCase();
        for (var key of Object.keys(regexp_replacements)) {
            str = str.replace(regexp_replacements[key], key);
        }
        return str === " " ? "" : str;
    }
}
```


## Q&A

### Why use FlexSearch as search engine?

At first, we also tried these other solutions: [Lunr.js](https://github.com/olivernn/lunr.js/),
[minisearch](https://github.com/lucaong/minisearch) and [fuse.js](https://fusejs.io/). At the end,
[FlexSearch](https://github.com/nextapps-de/flexsearch) offered the best overall results with
**fast** and **accurate** results, a **small enough** bundle size and it also was **easy** to
setup/configure. It got everything to be chosen!

### Why does my new article not appear in the search results?

No worries, it is normal. SearchinGhost uses a cache system to store your blog data in the
browser an limit network interaction. By default, cached data stored less than 30 minutes
ago are still considered as valid. After that time, the new article will be available to you.

Keep in mind that other users may **not** need to wait 30 minutes depending on the last time they
did a research. If you was 1h ago, their cache will be purged and renewed so the article will show up.

If you want your users to be always perfectly up to date, set the `cacheMaxAge` to `0`. When doing so,
you should also set `loadOn` to `'focus'` to limit the number of HTTP requests.

### How to optimize the pictures load time?

By default, when you use the `feature_image` URL variable to display images in your search results, you will always get the original/full size one
and they are generally too large (in size and weight) for our needs, a miniature would be a better fit.

Since Ghost V3, a media processing engine is embedded to create responsive images. By default, Ghost recreates 6 different images
of the given one. The available sizes are: `w30`, `w100`, `w300`, `w600`, `w1000`, `w2000`.

In our case, the easiest way load images faster is simply to use smaller images. Basically,
we want this URL `https://www.example.fr/content/images/2020/05/picture.jpg` (default one fetched from the Ghost API) to become
`https://www.example.fr/content/images/size/w600/2020/05/picture.jpg` (the 600px width one).

To do so, update the configuration by adding a `"customProcessing"` field with the following code example. Of course, you can
use any of the available size mentioned above instead of `w600`.

```js
customProcessing: function(post) {
    if (post.tags) post.string_tags = post.tags.map(o => o.name).join(' ').toLowerCase();
    if (post.feature_image) post.feature_image = post.feature_image.replace('/images/', '/images/size/w600/'); // reduce image size to w600
    return post;
}
```

This modification is **not** immediate, you need a cache refresh to actually see the difference.

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

### Can I display the latest posts when nothing is found?

Yes, by using SearchinGhost internals methods but it is possible. It may look like
black magic but add the code below to your current configuration. Here, `searchinGhost`
refers to your own instance created with `new SearchinGhost(...)`.

```js
emptyTemplate: function() {
    var allPostsArray = Object.values(searchinGhost.index.l);
    var latestPosts = allPostsArray.slice(0, 6);
    searchinGhost.display(latestPosts);
}
```

### Can I use this library with a JS framework?

If are using a framework like React, Vue or Angular, you probably do not want to let SearchinGhost
manipulate the DOM by itself. Because you definitely need to keep any content update within your framework,
here is the configuration you should use:

```js
var searchinGhost = new SearchinGhost({
    key: '<CONTENT_API_KEY>',
    inputId: false,
    outputId: false,
    [...]
});
```

Now, to run a search query, call this SearchinGhost method:

```js
var postsFound = searchinGhost.search("my query");

// Where 'postsFound' content looks like:
[
  {
    "title": "A Full and Comprehensive Style Test",
    "published_at": "Sep 1, 2012",
    [...]
  },
  {
    "title": "Publishing options",
    "published_at": "Aug 20, 2018",
    [...]
  }
]
```

This way, nothing will be rendered behind your back and everything will stay under control in the shadowDom.


## Road map

- [x] Use a logging strategy based on `debug: true`
- [x] Set up a clean build process using Webpack
- [x] Allow user to fetch data when page loads (not only on focus)
- [x] Add callbacks like `onFetchStart()`, `onSearchStart()`, ...
- [x] Use the GhostContentApi official library to give more configuration flexibility (and also support API v2)
- [x] Expose cache max age option to users
- [x] Add an optional empty template result
- [x] Add a custom user-defined post reformat function called before indexation
- [x] Expose 'searchOn' and 'loadOn' in the configuration
- [x] Clean the code and comments
- [x] Make the demo mobile-friendly, it currently looks ugly on small screens
- [ ] An in-depth code review made by a JS guru

From now on, any modification is tracked in this dedicated [CHANGELOG.md](CHANGELOG.md) file.


## Contribute

Any contribution is more than welcome! If you found a bug or would like to improve the code,
please feel free to create an issue or a PR.

All the code updates must be done under the `src` directory.

To build the project by yourself, run:

```sh
$ npm install
$ npm run build
```

When developing, use the watch command instead, it will rebuild faster at each file modification
and include a link to the source map which make debugging easier.

```sh
$ npm run watch
```

*Note: while creating this project I am using Node v12.16.2 with NPM v6.14.4 but is should also work with older/newer versions*


## Alternative solutions

SearchinGhost is not alone in the field of Ghost search plugins.
Here is a short list of other related projects. You should definitely give
them a try to see if they better fit your needs:


[GhostHunter](https://github.com/jamalneufeld/ghostHunter) (v0.6.0 - 101 kB, 26 kB gzip)

> Pros:
> - The most famous, a lot of articles and tutorials about it
> - A powerful cache system based on localStorage
> - Full text indexing (not only posts title)
>
> Cons:
> - Relies on jQuery
> - Only works with the Ghost v2 API (for now)
> - The source code became messy over time


[ghost-search](https://github.com/HauntedThemes/ghost-search) (v1.1.0 - 12 kB, 4.2 kB gzip)

> Pros:
> - Well written and easy-to-read code base
> - Leverage 'fuzzy' capabilities
>
> Cons:
> - Browser lags when searching long words
> - Might send too many API requests
> - Does not use a scoring system to display the best results first

 
[Ghost Finder](https://github.com/electronthemes/ghost-finder) (v3.1.2 - 459 kB, 116 kB gzip)

> Pros:
> - Pure Javascript library
>
> Cons:
> - The massive final bundle size
> - Send an HTTP request for each key pressed!
> - Does not use a search engine, only looks for substrings in posts titles
> - Does not correctly index accentuated characters (e.g. 'é' should be found with 'e')
