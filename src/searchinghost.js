import FlexSearch from 'flexsearch';
import GhostContentAPI from '@tryghost/content-api';

export default class SearchinGhost {

    /**
     * Constructor and entry point of the library
     * @param {Document} args 
     */
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
            indexOptions: {},
            debug: false
        }
        
        this.dataLoaded = false;  // flag to ensure data are properly loaded
        this.postsCount = 0;      // keep track of posts ID, must be numeric
        this.storage = this.getLocalStorageOption();

        this.initConfig(args);
        this.addSearchListeners();
        this.triggerDataLoad();
    }

    /**
     * Apply the user configuration and initialize important variables
     * @param {Document} args 
     */
    initConfig(args) {
        for (let [key, value] of Object.entries(args)) {
            this.config[key] = value;
        }

        // Ensure 'updated_at' will be fetched, needed for the local storage logic
        this.originalPostsFields = this.config.postsFields;
        if (!this.config.postsFields.includes('updated_at')) {
            this.config.postsFields.push('updated_at');
        }

        this.searchBar = document.getElementById(this.config.inputId);
        if (!this.searchBar) {
            throw `Enable to find the input #${this.config.inputId}, please check your configuration`;
        }

        this.ghostApi = new GhostContentAPI({
            url: this.config.url,
            key: this.config.key,
            version: this.config.version
        });

        this.index = this.getNewSearchIndex();
    }

    /**
     * Set the search input bar and form event listeners to trigger
     * further searches
     */
    addSearchListeners() {
        // In any case, prevent the input form from being submitted
        let searchForm = this.searchBar.closest('form');
        if (searchForm) {
            searchForm.addEventListener("submit", (ev) => { ev.preventDefault(); });
        }

        switch(this.config.searchOn) {
        case 'keyup':
            this.searchBar.addEventListener("keyup", () => {
                let inputQuery = this.searchBar.value.toLowerCase();
                this.search(inputQuery);
            });
            break;
        case 'submit':
            if (searchForm) {
                searchForm.addEventListener("submit", () => {
                    let inputQuery = this.searchBar.value.toLowerCase();
                    this.search(inputQuery);
                });
            } else {
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

    /**
     * Set triggers to load the posts data when ready
     */
    triggerDataLoad() {
        switch(this.config.loadOn) {
        case 'focus':
            this.searchBar.addEventListener('focus', () => {
                if (!this.dataLoaded) this.loadData();
            });
            break;
        case 'page':
            window.addEventListener('load', () => {
                if (!this.dataLoaded) this.loadData();
            });
            break;
        case 'none':
            // do nothing
            break;
        default:
            throw `Unknown "loadOn" option: '${this.config.loadOn}'`
        }
    }

    /**
     * Actually load the data into a searchable index.
     * When this method is completed, we are ready to launch search queries.
     */
    loadData() {
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

    /**
     * Ensure stored data are up to date.
     */
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

    /**
     * Fetch, format and store posts data from Ghost.
     */
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
                console.error("Unable to fetch Ghost data", error);
            });
    }

    /**
     * Format a post document before being indexed.
     * @param {Document} post 
     * @return {Document} The formatted post
     */
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

    /**
     * Execute a search query.
     * @param {string} inputQuery 
     */
    search(inputQuery) {
        if (!this.dataLoaded) this.loadData();

        this.config.onSearchStart();

        let postsFound = this.index.search(inputQuery, {
            limit: this.config.limit
        });

        this.display(postsFound);

        this.config.onSearchEnd(postsFound);
    }

    /**
     * Display the results as HTML into the configured DOM output element.
     * @param {Document[]} posts 
     */
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

    /**
     * Apply post content against an HTML template. If the resulting
     * HTML is empty (or any other JS falsy value), `undefined` is returned.
     * @param {function} template 
     * @param {Document} optionalPost 
     * @return {HTMLElement} The generated HTML or undefined
     */
    evaluateTemplate(template, optionalPost) {
        let generatedHTML = template(optionalPost);
        if (!generatedHTML) return;

        let newElement = document.createElement(this.config.outputChildsType);
        newElement.classList.add(`${this.config.outputId}-item`);
        newElement.innerHTML = generatedHTML;
        return newElement;
    }

    /**
     * Get a new instance of FlexSearch.
     * @return {FlexSearch} The instance of FlexSearch.
     */
    getNewSearchIndex() {
        const indexConfig = {
            doc: {
                id: "id",
                field: this.config.indexedFields
            },
            encode: "simple",
            tokenize: "forward",
            threshold: 0,
            resolution: 4,
            depth: 0
        }

        for (let [key, value] of Object.entries(this.config.indexOptions)) {
            indexConfig[key] = value;
        }
        
        return new FlexSearch(indexConfig);
    }

    /**
     * Get the date in the locale expected format
     * @param {string} date 
     * @return {string} The formatted date
     */
    prettyDate(date) {
        let d = new Date(date);
        return d.toLocaleDateString(this.config.date.locale, this.config.date.options);
    }

    /**
     * Safely get the local storage object if available.
     * If the user browser disabled it, get `undefined` instead.
     * @return {Storage} The storage object or `undefined`
     */
    getLocalStorageOption() {
        try {
            window.localStorage.setItem('storage-availability-test', '');
            window.localStorage.removeItem('storage-availability-test');
            return window.localStorage;
        } catch(err) {
            return undefined;
        }
    }

    /**
     * Simple logger function.
     * Output logs only if `debug` is set to `true`.
     * @param {string} str 
     */
    log(str) {
        if (this.config.debug) console.log(str);
    }
}
