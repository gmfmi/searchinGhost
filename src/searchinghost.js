import FlexSearch from 'flexsearch';
import GhostContentAPI from '@tryghost/content-api';

export default class SearchinGhost {

    constructor(args) {
        this.config = {
            url: window.location.origin,
            key: '',
            version: 'v3',
            loadOn: 'page',
            inputId: 'search-bar',
            outputId: 'search-results',
            postsFields: ['title', 'url', 'excerpt', 'custom_excerpt', 'published_at', 'feature_image'],
            postsExtraFields: ['tags'],
            postsFormats: ['plaintext'],
            indexedFields: ['title', 'string_tags', 'excerpt', 'plaintext'],
            resultElementType: 'div',
            template: function(post) {
                var o = `<a href="${post.url}"><figure>`
                if (post.feature_image) o += `<img src="${post.feature_image}">`
                o += '</figure><section>'
                if (post.tags.length > 0) {
                    o += `<header>#${post.tags[0].name} - ${post.published_at}</header>`
                } else {
                    o += `<header>#UNKNOWN - ${post.published_at}</header>`
                }
                o += `<h2>${post.title}</h2><p>${post.excerpt}</p></section></a>`
                return o;
            },
            emptyTemplate: function() {},
            customProcessing: function(post) {
                return post;
            },
            date: {
                locale: 'en-US',
                options: { year: 'numeric', month: 'short', day: 'numeric' }
            },
            cacheMaxAge: 3600,
            onFetchStart: function() {},
            onFetchEnd: function(posts) {},
            onIndexBuildStart: function() {},
            onIndexBuildEnd: function(index) {},
            onSearchStart: function() {},
            onSearchEnd: function(posts) {},
            debug: false
        }

        // Merge the custom configuration with the default one
        // and add extra needed vars
        this.buildConfig(args);

        // A flag to ensure data are properly loaded
        this.dataLoaded = false;

        // TODO: what if 'localStorage' not enabled ?
        this.storage = window.localStorage;

        // Init FlexSearch search engine
        this.initIndex();

        // Add listeners to trigger events from search bar
        this.setEventListners();

        // Finally, load up the search engine
        if (this.config.loadOn === 'focus') {
            let searchBar = document.getElementById(this.config.inputId);
            searchBar.addEventListener('focus', () => {
                if (!this.dataLoaded) {
                    this.loadResources();
                }
            });
        } else {
            // default behaviour
            window.addEventListener('load', () => {
                this.loadResources();
            });
        }
    }

    buildConfig(args) {
        for (let [key, value] of Object.entries(args)) {
            this.config[key] = value;
        }

        // Used to set posts ID, must be numeric
        this.postsCount = 0;

        // Ensure 'updated_at' existance, needed for the local storage logic
        this.originalPostsFields = this.config.postsFields;
        if (!this.config.postsFields.includes('updated_at')) {
            this.config.postsFields.push('updated_at');
        }

        this.ghostApi = new GhostContentAPI({
            url: this.config.url,
            key: this.config.key,
            version: this.config.version
        });
    }

    initIndex() {
        this.index = new FlexSearch({
            "doc": {
                "id": "id",
                "field": this.config.indexedFields
            },
            "encode": "simple",
            "tokenize": "forward",
            "threshold": 0,
            "resolution": 4,
            "depth": 0
        });
    }

    setEventListners() {
        let searchBar = document.getElementById(this.config.inputId);

        // Disable page reloading when the 'enter' key is pressed
        let searchForm = searchBar.closest('form');
        if (searchForm) {
            searchForm.addEventListener("submit", (e) => {
                e.preventDefault();
            });
        }

        searchBar.addEventListener("keyup", () => {
            if (!this.dataLoaded) {
                this.loadResources();
            }
            let query = searchBar.value.toLowerCase();
            this.search(query);
        });
    }

    loadResources() {
        let storedIndex = this.storage.getItem("SearchinGhost_index");
        if (storedIndex) {
            if (this.config.debug) console.log("Load locally stored index");
            this.config.onIndexBuildStart();
            this.index.import(storedIndex);
            this.dataLoaded = true;
            this.config.onIndexBuildEnd(this.index);
            this.validateCache();
        } else {
            if (this.config.debug) console.log("No stored index found");
            this.fetch();
        }
    }

    validateCache() {
        if (this.config.debug) console.log("Start validating stored cache data");

        let lastUpdate = this.storage.getItem("SearchinGhost_lastCacheUpdateTimestamp");
        if (!lastUpdate) {
            if (this.config.debug) console.log("No cache update timestamp found, purge the cache");
            this.fetch();
            return;
        }

        lastUpdate = new Date(lastUpdate);
        let elapsedTime = Math.round((new Date() - lastUpdate) / 1000);
        if (elapsedTime < this.config.cacheMaxAge) {
            if (this.config.debug) console.log(`Skip cache refreshing, updated less than ${this.config.cacheMaxAge}s ago (${elapsedTime}s)`);
            return;
        }

        this.ghostApi
            .posts
            .browse({
                limit: 1,
                fields: ['updated_at'],
                order: 'updated_at DESC'
            })
            .then((posts) => {
                let storedUpdateTimestamp = this.storage.getItem("SearchinGhost_updatedat");
                let latestPostUpdateTimestamp = posts[0].updated_at;
                if (latestPostUpdateTimestamp !== storedUpdateTimestamp) {
                    if (this.config.debug) console.log("Local cache not up to date, purge it");
                    this.fetch();
                } else {
                    if (this.config.debug) console.log("Local cached data up to date");
                    this.storage.setItem("SearchinGhost_lastCacheUpdateTimestamp", new Date().toISOString());
                }
            }).catch((error) => {
                console.error("Unable to fetch the latest post information to check cache state", error);
            });
    }

    fetch() {
        if (this.config.debug) console.log("Start fetching posts from Ghost API");
        this.config.onFetchStart();

        let browseOptions = {
            limit: 'all',
            fields: this.config.postsFields,
            order: 'updated_at DESC'
        }
        if (this.config.postsExtraFields.length > 0) browseOptions.include = this.config.postsExtraFields;
        if (this.config.postsFormats.length > 0) browseOptions.formats = this.config.postsFormats;

        this.ghostApi
            .posts
            .browse(browseOptions)
            .then((posts) => {
                this.config.onFetchEnd(posts);
                this.config.onIndexBuildStart();
                let updatedAt = posts[0].updated_at;
                this.initIndex();
                posts.forEach((post) => {
                    let formattedPost = this.format(post);
                    this.index.add(formattedPost);
                });
                this.dataLoaded = true;
                this.config.onIndexBuildEnd(this.index);
                this.storage.setItem("SearchinGhost_index", this.index.export());
                this.storage.setItem("SearchinGhost_updatedat", updatedAt);
                this.storage.setItem("SearchinGhost_lastCacheUpdateTimestamp", new Date().toISOString());
                if (this.config.debug) console.log("Search index created and stored");
            })
            .catch((error) => {
                console.error("Unable to fetch or store post resources", error);
            });
    }

    format(post) {
        // Need to use a numeric ID to improve performance & disk space
        post.id = this.postsCount++;

        // display date using 'locale' format
        post.published_at = this.prettyDate(post.published_at);

        // only used to keep track of the last fetch time,
        // remove it before indexing BUT only if not wanted by the user
        if (!this.originalPostsFields.includes('updated_at')) {
            delete post.updated_at;
        }

        if (post.custom_excerpt) {
            post.excerpt = post.custom_excerpt;
            delete post.custom_excerpt;
        }

        if (post.tags) {
            post.string_tags = post.tags.map(o => o.name).join(' ').toLowerCase();
        }

        post = this.config.customProcessing(post);

        return post;
    }

    prettyDate(date) {
        let d = new Date(date);
        return d.toLocaleDateString(this.config.date.locale, this.config.date.options);
    }

    search(query) {
        this.config.onSearchStart();

        let postsFound = this.index.search(query, {
            limit: 7
        });

        this.display(postsFound);

        this.config.onSearchEnd(postsFound);
    }

    display(posts) {
        let resultParentElement = document.getElementById(this.config.outputId);
        resultParentElement.innerHTML = "";

        if (posts.length < 1) {
            let resultElement = this.evaluateTemplate(this.config.emptyTemplate, null);
            if (resultElement) resultParentElement.appendChild(resultElement);
            return;
        }

        posts.forEach((post) => {
            let resultElement = this.evaluateTemplate(this.config.template, post);
            if (resultElement) resultParentElement.appendChild(resultElement);
        });
    }

    evaluateTemplate(template, optionalPost) {
        let generatedTemplate = template(optionalPost);
        if (!generatedTemplate) return;

        let newElement = document.createElement(this.config.resultElementType);
        newElement.classList.add(`${this.config.outputId}-item`);
        newElement.innerHTML = generatedTemplate;
        return newElement;
    }
}
