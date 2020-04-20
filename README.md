# SeachinGhost

A pure javascript, lightweight & full-text search engine for [Ghost](https://ghost.org/) (blog)


## Description

SearchinGhost is a lightweight search engine dedicated to the Ghost blogging platform. In its core, it uses
the [Ghost Content API](https://ghost.org/docs/api/v3/content/) to load your blog content and the powerful
[FlexSearch](https://github.com/nextapps-de/flexsearch) library to index and run search queries.

Everything happens in the client browser, this helps us to deliver blazing-fast seach result and display them
in real-time to your users (a.k.a "search-as-you-type"). We also take care about minimizing network loads by
relying on the browser `localStorage` and only sending request when necessary.

Try it by yourself with this [Live Demo](https://gmfmi.github.io/searchinGhost/) (data fetched from the offical Ghost demo).


## Quick Start

First, update the `default.hbs` file of your theme to include an input field and a div element to display the search results. Then, add a link to searchinGhost and initialize it with your own `CONTENT_API_KEY`. To get the content API key, please refer to the official [Ghost documentation](https://ghost.org/docs/api/v3/content/#key).

```html
<input id="search-bar">
<div id="search-results"></div>

<script src="https://cdn.jsdelivr.net/gh/gmfmi/searchinGhost/dist/searchinghost.min.js"></script>
<script>
    var searchinGhost = new SearchinGhost({
        key: 'CONTENT_API_KEY'
    });
</script>
```

That's it, everything is done!
If you need a more fine-grained configuration to better fit your needs, please read the next sections.


## Installation

You can install searchinGhost using various method, here are the possibilities:

- **From source**

Download the `dist/searchinghost.min.js` file to your `js` them folder and update your template with:

```html
<script src="{{asset 'js/searchinghost.min.js'}}"></script>
```

- **From a Content Delivery Network (CDN)**

```html
<script src="https://cdn.jsdelivr.net/gh/searchinghost@0.1.0/dist/searchinghost.min.js"></script>
<!-- Set a version is prefered but if you want to be bleeding edge... -->
<script src="https://cdn.jsdelivr.net/gh/searchinghost/dist/searchinghost.min.js"></script>
```

- **From NPM**

```sh
$ npm install searchinghost --save-dev 
```

```js
import SearchinGhost from 'searchinghost';
// OR
var SearchinGhost = require('searchinghost');
```


## Configuration

When using searchinGhost, the only mandatory field is `key`.
Any other field get a default value and is optional. But of course,
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
> use what ever you want.
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

- **debug** (boolean: false)
> When something is not working as expected, set this option to `true`
> to see the application logs.



## Known issues

- [ ] Properly handle network errors
- [ ] Define a real logging strategy based on `debug: true`


## Road map

- [x] Set up a clean build process using Webpack
- [ ] Ask someone to do a code review because I am not a Javascript dev 😅
- [ ] Allow user to fetch data when page loads (not only on focus)
- [ ] Maybe use the GhostContentApi library to fech the content and give more flexibility to users (also support API v2?)
- [ ] Add callback like `onInit()`, `onDataFetch()`, ...
- [ ] Make the demo mobile-first, currently it looks ugly on small screens


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


[Ghost Hunter](https://github.com/jamalneufeld/ghostHunter) (101 Kb, 26 Kb gzip)

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


[Ghost search](https://github.com/HauntedThemes/ghost-search) (12 Kb, 4.2 Kb gzip)

> pros:
> - Well writen and easy-to-ready code base
> - Leverage 'fuzzy' capabilities
>
> cons:
> - Browser lags when seaching long words
> - Might send too many API requests
> - Do not use a scoring system to display the best results first

 
[Ghost finder](https://github.com/electronthemes/ghost-finder) (827 Kb, 159 Kb gzip)

> pros:
> - Pure Javascript library
>
> cons:
> - The incredibly massive final bundle size
> - Send an HTTP request at each key pressed!
> - Do not use a search engine, only look for substring in posts titles
> - Do not correctly index accentuated characters (e.g 'é' should be found with 'e')
