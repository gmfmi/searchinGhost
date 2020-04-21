[![](https://img.shields.io/npm/v/searchinghost?style=flat-square)](https://www.npmjs.com/package/searchinghost)
![](https://img.shields.io/bundlephobia/minzip/searchinghost?label=gzip&style=flat-square)
[![](https://img.shields.io/badge/ghost-%3E%3D%203.0-blue?style=flat-square)](https://ghost.org/)
[![](https://data.jsdelivr.com/v1/package/npm/searchinghost/badge)](https://www.jsdelivr.com/package/npm/searchinghost)


# SeachinGhost

A pure javascript, lightweight & full-text search engine for [Ghost](https://ghost.org/) (blog)


## Description

SearchinGhost is a lightweight search engine dedicated to the Ghost blogging platform. In its core, it uses
the [Ghost Content API](https://ghost.org/docs/api/v3/content/) to load your blog content and the powerful
[FlexSearch](https://github.com/nextapps-de/flexsearch) library to index and run search queries.

Everything happens in the client browser, it helps us to deliver blazing fast search results and displays them
in real-time to your users (a.k.a "search-as-you-type"). We also take care about minimizing network loads by
relying on the browser `localStorage` only sending request when necessary.

Try it by yourself with this [Live Demo](https://gmfmi.github.io/searchinGhost/) (data fetched from the offical Ghost demo).


## Quick Start

First, update the `default.hbs` file of your theme to include an input field and a div element to display the search results. Then, add a link to searchinGhost and initialize it with your own `CONTENT_API_KEY`. To get the content API key, please refer to the official [Ghost documentation](https://ghost.org/docs/api/v3/content/#key).

```html
<input id="search-bar">
<div id="search-results"></div>

<script src="https://cdn.jsdelivr.net/npm/searchinghost@0.2.0/dist/searchinghost.min.js"></script>
<script>
    var searchinGhost = new SearchinGhost({
        key: 'CONTENT_API_KEY'
    });
</script>
```

That's it, everything is done!
If you need a more fine-grained configuration to better fit your needs, please read the next sections.


## Installation

You can install searchinGhost using various methods, here are the possibilities:

- **From source**

Download the `dist/searchinghost.min.js` file to your `js` theme folder and update your template with:

```html
<script src="{{asset 'js/searchinghost.min.js'}}"></script>
```

- **From a Content Delivery Network (CDN)**

```html
<script src="https://cdn.jsdelivr.net/npm/searchinghost@0.2.0/dist/searchinghost.min.js"></script>
<!-- Setting a version is prefered (but if you want to live bleeding edge...) -->
<script src="https://cdn.jsdelivr.net/npm/searchinghost@latest/dist/searchinghost.min.js"></script>
```

- **From NPM**

```sh
$ npm install searchinghost
```

```js
import SearchinGhost from 'searchinghost';
// OR
var SearchinGhost = require('searchinghost');
```


## Configuration

When using searchinGhost, the only mandatory configuration field is `key`.
Any other field get a default value and is optional. Nevertheless,
a little bit of configuration could be worth it!

```js
// SearchinGhost minimal configuration
var searchinGhost = new SearchinGhost({
    key: '<CONTENT_API_KEY>'
});
```

Here is the complete configuration used by default:

```js
{
    url: window.location.origin,
    key: '',
    version: 'v3',
    inputId: 'search-bar',
    outputId: 'search-results',
    outputElementType: 'div',
    template: function(post) {
        var t = `<a href="${post.url}"><figure>`
        if (post.feature_image) t += `<img src="${post.feature_image}">`
        t += `</figure>
        <section>
            <header>#${post.tags} - ${post.published_at}</header>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
        </section>
        </a>`
        return t;
    },
    date: {
        locale: 'en-US',
        options: { year: 'numeric', month: 'short', day: 'numeric' }
    },
    onFetchStart: function() {},
    onFetchEnd: function(posts) {},
    onIndexBuildStart: function() {},
    onIndexBuildEnd: function() {},
    onSearchStart: function() {},
    onSearchEnd: function(posts) {},
    debug: false
}
```

## Options

- **url** (string: window.location.origin)
> The full domaine name of the Ghost API.
>
> example: 'https://demo.ghost.io'

- **key** (string, mandatory)
> The public content API key to get access to the defined URL.
>
> example: '22444f78447824223cefc48062'

- **version** (string: 'v3')
> Set the Ghost API version. For now, only the v3 is available.

- **loadOn** (string: 'focus')
> Set the library loading strategy. It can be triggered when the HTML page has loaded
> or only on demand when the user click on the search bar.
> values: `"focus"` or `"page"`

- **inputId** (string: 'search-bar')
> The HTML `id` param defined on your input search bar.
> Do not include '#' in the name.
>
> example: 'my-wonderful-search-bar-id'

- **outputId** (string: 'search-results')
> The HTML `id` param defined on your output element. This element should be
> empty in your template, it will be filled with the search results.
>
> example: 'put-the-results-here'

- **outputElementType** (string: 'div')
> By default, the output element is expected to be a `div` but you can
> use whatever you want.
>
> example: 'section'

- **template** (function)
> Define your own result template. This template will be used for each post found to
> generate the result and appended as child element to the output element.
>
> Please note the use of **backticks** (e.g. '`') instead of single/double quotes. This
> is required to allow javascript [variable interpolation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).
>
> Available variables: `url`, `tags`, `published_at`, `feature_image`
>
> example:
> ```js
> function (post) {
>    return `<a href="${post.url}">#${post.tags} - ${post.published_at} - ${post.title}</a>`
> }
> ```

- **date** (object)
> Define the date format fetched from posts. See the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString#Using_options)
> to get more information.

- **onFetchStart** (function)
> Define a callback function before we fetch the data from the Ghost API.
> This function takes no argument.
>
> example:
> ```js
> onFetchStart: function() {
>   console.log("before data fetch");
> }
> ```

- **onFetchEnd** (function)
> Define a callback function when the fetch is complete. The function takes one
> argument: the array of all posts returned by Ghost itself.
> This allows you to manipulate the data before being stored. Any modification made
> to `posts` will be kept.
>
> example:
> ```js
> onFetchEnd: function(posts) {
>   console.log("all posts fetched");
>   posts.forEach(function(item) {
>       console.log("Post content:", item);
>   });
> }
> ```

- **onIndexBuildStart** (function)
> Define a callback function before we start building the search index.
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
> The function takes no argument.
>
> example:
> ```js
> onIndexBuildEnd: function() {
>   console.log("index build complete");
> }
> ```

- **onSearchStart** (function)
> Define a callback function before starting to execute the search query. For
> instance, it could be used to hide the results `div` while waiting for the
> `onSearchEnd` completion. But in most cases, this is not necessary because
> the search function is really fast but it might be useful on a very large database.
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
> The function takes 1 argument: the array of matching posts.
>
> example:
> ```js
> onSearchStart: function(posts) {
>   console.log("before executing the search query");
>   posts.forEach(function(item) {
>        // ...
>   });
> }
> ```

- **debug** (boolean: false)
> When something is not working as expected, set to `true`
> to display application logs.


## Internals

This section describe how searchinGhost works from the inside. It will make the code logic
clearer and hopefully motivate you to actually read it.

--> TODO before v1.0.0 release


## Known issues

- [x] Define a real logging strategy based on `debug: true`
- [ ] Properly handle network errors


## Road map

- [x] Set up a clean build process using Webpack
- [x] Allow user to fetch data when page loads (not only on focus)
- [x] Add callbacks like `onFetchStart()`, `onSearchStart()`, ...
- [ ] Maybe use the GhostContentApi library to fetch the content and give more flexibility to users (also support API v2?)
- [ ] Make the demo mobile-first, currently it looks ugly on small screens
- [ ] Ask someone to do a code review because I am not a Javascript dev 😅


## Contribute

Any contribution is more than welcome! If you found a bug feel free to post an issue or a PR.

Note that all the code update must be done under the `src` directory.

To build the project by yourself, run:

```sh
$ npm install
$ npm run build
```

*Note: while creating this project I am using Node v12.16.2 with NPM v6.14.4 but is should also work with older/newer versions*


## Alternative solutions

SearchinGhost is not alone in the field of Ghost search engines.
Here is a short list of other related projects. You should definitely give
them a try to see if they better fit your needs:


[Ghost Hunter](https://github.com/jamalneufeld/ghostHunter) (101 kB, 26 kB gzip)

> pros:
> - Probably the most famous
> - The most complete solution out there
> - A powerful cache system based on localStorage
> - Full text indexation (not only post titles)
>
> cons:
> - Rely on jQuery
> - Only works with the Ghost v2 API (for now)
> - The source code became messy over time


[Ghost search](https://github.com/HauntedThemes/ghost-search) (12 kB, 4.2 kB gzip)

> pros:
> - Well writen and easy-to-read code base
> - Leverage 'fuzzy' capabilities
>
> cons:
> - Browser lags when searching long words
> - Might send too many API requests
> - Do not use a scoring system to display the best results first

 
[Ghost finder](https://github.com/electronthemes/ghost-finder) (827 kB, 159 kB gzip)

> pros:
> - Pure Javascript library
>
> cons:
> - The incredibly massive final bundle size
> - Send an HTTP request for each key pressed!
> - Do not use a search engine, only look for substring in posts titles
> - Do not correctly index accentuated characters (e.g 'é' should be found with 'e')
