import FlexSearch from 'flexsearch';
import GhostContentAPI from '@tryghost/content-api';

export default class SearchinGhost {

    constructor(args) {
        this.config = {
            url: window.location.origin,
            key: '',
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
        }
        
        this.dataLoaded = false;  // flag to ensure data are properly loaded
        this.postsCount = 0;      // keep track of posts ID, must be numeric
        this.storage = this.getLocalStorage();
        this.init(args);
        this.setEventListners();
        this.start();
    }

    init(args) {
        for (let [key, value] of Object.entries(args)) {
            this.config[key] = value;
        }

        // Ensure 'updated_at' will be fetched, needed for the local storage logic
        this.originalPostsFields = this.config.postsFields;
        if (!this.config.postsFields.includes('updated_at')) {
            this.config.postsFields.push('updated_at');
        }

        let searchBarElement = document.getElementById(this.config.inputId);
        if (searchBarElement) {
            this.searchBar = searchBarElement;
        } else {
            throw `Enable to find the input #${this.config.inputId}, please check your configuration`;
        }

        this.ghostApi = new GhostContentAPI({
            url: this.config.url,
            key: this.config.key,
            version: this.config.version
        });

        this.index = this.getNewSearchIndex();
    }

    getNewSearchIndex() {
        return new FlexSearch({
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
        let searchForm = this.searchBar.closest('form');
        if (searchForm) {
            searchForm.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!this.dataLoaded) this.loadResources();
                let query = this.searchBar.value.toLowerCase();
                this.search(query);
            });
        }

        switch(this.config.searchOn) {
        case 'keyup':
            this.searchBar.addEventListener("keyup", () => {
                if (!this.dataLoaded) this.loadResources();
                let query = this.searchBar.value.toLowerCase();
                this.search(query);
            });
            break;
        case 'submit':
            if (!searchForm) {
                throw `No form associated with the input ID #${this.config.inputId}, unable to start SearchinGhost`;
            }
            break;
        case 'none':
            // do nothing
            break;
        default:
            throw `Unknown "searchOn" option: '${this.config.searchOn}'`
        }
    }

    start() {
        switch(this.config.loadOn) {
        case 'focus':
            this.searchBar.addEventListener('focus', () => {
                if (!this.dataLoaded) this.loadResources();
            });
            break;
        case 'page':
            window.addEventListener('load', () => {
                if (!this.dataLoaded) this.loadResources();
            });
            break;
        case 'none':
            // do nothing
            break;
        default:
            throw `Unknown "loadOn" option: '${this.config.loadOn}'`
        }
    }

    loadResources() {
        if (!this.storage) {
            this.log("No local storage available, switch to degraded mode");
            this.fetch();
            return;
        }

        let storedIndex = this.storage.getItem("SearchinGhost_index");
        if (storedIndex) {
            this.log("Found an index stored locally, loads it");
            this.config.onIndexBuildStart();
            this.index.import(storedIndex);
            this.dataLoaded = true;
            this.config.onIndexBuildEnd(this.index);
            this.validateCache();
        } else {
            this.log("No already stored index found");
            this.fetch();
        }
    }

    validateCache() {
        let lastUpdate = this.storage.getItem("SearchinGhost_lastCacheUpdateTimestamp");
        if (!lastUpdate) {
            this.log("No cache update timestamp found, purge the cache");
            this.fetch();
            return;
        }

        lastUpdate = new Date(lastUpdate);
        let elapsedTime = Math.round((new Date() - lastUpdate) / 1000);
        if (elapsedTime < this.config.cacheMaxAge) {
            this.log(`Skip cache refreshing, updated less than ${this.config.cacheMaxAge}s ago (${elapsedTime}s)`);
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
                    this.log("Local cache outdated, purge it");
                    this.fetch();
                } else {
                    this.log("Local cached data up to date");
                    this.storage.setItem("SearchinGhost_lastCacheUpdateTimestamp", new Date().toISOString());
                }
            }).catch((error) => {
                console.error("Unable to fetch the latest post information to check cache state", error);
            });
    }

    fetch() {
        this.log("Fetching data from Ghost API");
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
                this.index = this.getNewSearchIndex();
                posts.forEach((post) => {
                    let formattedPost = this.format(post);
                    if (formattedPost) this.index.add(formattedPost);
                });
                this.dataLoaded = true;
                this.config.onIndexBuildEnd(this.index);
                if (this.storage) {
                    this.storage.setItem("SearchinGhost_index", this.index.export());
                    this.storage.setItem("SearchinGhost_updatedat", updatedAt);
                    this.storage.setItem("SearchinGhost_lastCacheUpdateTimestamp", new Date().toISOString());
                }
                this.log("Search index build complete");
            })
            .catch((error) => {
                console.error("Unable to fetch Ghost data resources", error);
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
            limit: this.config.limit
        });

        this.display(postsFound);

        this.config.onSearchEnd(postsFound);
    }

    display(posts) {
        let resultParentElement = document.getElementById(this.config.outputId);
        resultParentElement.innerHTML = '';

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

        let newElement = document.createElement(this.config.outputChildsType);
        newElement.classList.add(`${this.config.outputId}-item`);
        newElement.innerHTML = generatedTemplate;
        return newElement;
    }

    getLocalStorage() {
        try {
            window.localStorage.setItem('test', '');
            window.localStorage.removeItem('test');
            return window.localStorage;
        } catch(err) {
            return undefined;
        }
    }

    log(str) {
        if (this.config.debug) console.log(str);
    }
}
