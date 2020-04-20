import FlexSearch from 'flexsearch';

export default class SearchinGhost {

    constructor(args) {
        this.config = {
            url: window.location.origin,
            key: '',
            version: 'v3',
            loadOn: 'focus',
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

        this.buildConfig(args);

        this.dataLoaded = false;
        this.storage = localStorage;

        // init the search engine
        this.initIndex();
        
        // Add listeners to trigger events from search bar
        this.setEventListners();

        // Finally, load the search engine
        if (this.config.loadOn === 'page') {
            window.addEventListener('load', () => {
                this.loadResources();
            });
        } else {
            let searchBar = document.getElementById(this.config.inputId);
            searchBar.addEventListener('focus', () => {
                if (!this.dataLoaded) {
                    this.loadResources();
                }
            });
        }
    }

    buildConfig(args) {
        for (let [key, value] of Object.entries(args)) {
            this.config[key] = value;
        }

        this.config.apiUrl = `${this.config.url}/ghost/api/${this.config.version}/content/posts/`

        // TODO: set a variable if "localStorage" is not enabled
    }

    initIndex() {
        this.index = new FlexSearch({
            "doc": {
                "id": "id",
                "field": [
                    "title",
                    "tags",
                    "excerpt",
                    "plaintext"
                ]
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

        // Disable page reloading when 'enter' key is pressed
        let searchForm = searchBar.closest('form');
        if (searchForm !== null) {
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
        if (storedIndex !== null) {
            if (this.config.debug) console.log("Load locally stored index");
            this.index.import(storedIndex);
            this.dataLoaded = true;
            this.validateCache();
        } else {
            if (this.config.debug) console.log("No stored index found");
            this.fetch();
            this.dataLoaded = true;
        }
    }

    reformat(posts) {
        posts.forEach((post, id) => {
            // use a number as id, improve performance & disk space
            post.id = id;

            // display date using 'locale' format
            post.published_at = this.prettyDate(post.published_at);

            // only used to watermark, remove it before indexing
            delete post.updated_at;

            if (post.custom_excerpt !== null) {
                post.excerpt = post.custom_excerpt;
            }
            delete post.custom_excerpt;

            if (post.tags.length > 0) {
                post.tags = post.tags[0].name.toLowerCase();
            } else {
                post.tags = "unknown";
            }

            if (post.feature_image === null) {
                delete post.feature_image;
            }
        });
        return posts;
    }

    prettyDate(date) {
        let d = new Date(date);
        return d.toLocaleDateString(this.config.date.locale, this.config.date.options);
    }

    fetch() {
        if (this.config.debug) console.log("Start fetching posts from Ghost API");
        fetch(this.getAllPostsUrl())
        .then(response => {
            return response.json();
        }).then(responseContent => {
            let updatedAt = responseContent.posts[0].updated_at;
            let posts = this.reformat(responseContent.posts);
            this.initIndex();
            posts.forEach(post => {
                this.index.add(post);
            });
            this.storage.setItem("SearchinGhost_index", this.index.export());
            this.storage.setItem("SearchinGhost_updatedat", updatedAt);
            this.storage.setItem("SearchinGhost_watermark", new Date().toISOString());
            this.dataLoaded = true;
            if (this.config.debug) console.log("Search index created and stored");
        }).catch(error => {
            console.error("Unable to fetch or store post resources", error);
        });
    }

    search(query) {
        let postsFound = this.index.search(query, {
            limit: 7
        });

        let outputHtmlElement = document.getElementById(this.config.outputId);
        outputHtmlElement.innerHTML = "";
        
        postsFound.forEach(post => {
            let resultNode = document.createElement(this.config.outputElementType);
            resultNode.classList.add(`${this.config.outputId}-item`);
            resultNode.innerHTML = this.config.template(post);
            outputHtmlElement.appendChild(resultNode);
        });
    }

    validateCache() {
        if (this.config.debug) console.log("Start validating stored cache data");
        
        let storedWatermark = this.storage.getItem("SearchinGhost_watermark");
        if (storedWatermark === null) {
            return;
        } else {
            storedWatermark = new Date(storedWatermark);
        }

        let elapsedTime = Math.round((new Date() - storedWatermark) / 1000);
        if (elapsedTime < 3600) {
            if (this.config.debug) console.log(`Skip cache refreshing, updated less than 1h ago (${elapsedTime} secs)`)
            return;
        }
        
        fetch(this.getLatestPostUrl())
        .then(response => {
            return response.json();
        }).then(responseContent => {
            let storedUpdateTimestamp = this.storage.getItem("SearchinGhost_updatedat");
            let foundUpdateTimestamp = responseContent.posts[0].updated_at;
            if (foundUpdateTimestamp !== storedUpdateTimestamp) {
                if (this.config.debug) console.log("Local cache not up to date, invalidating it");
                this.fetch();
            } else {
                if (this.config.debug) console.log("Local cached data up to date");
            }
        }).catch(error => {
            console.error("Unable to fetch the latest post information to check cache state", error);
        });
    }

    getAllPostsUrl() {
        const apiParams = `?key=${this.config.key}`
                            + '&fields=title,url,excerpt,custom_excerpt,published_at,updated_at,feature_image'
                            + '&include=tags'
                            + '&formats=plaintext'
                            + '&order=updated_at%20desc'
                            + '&limit=all'
        return this.config.apiUrl + apiParams;
    }

    getLatestPostUrl() {
        const apiParams = `?key=${this.config.key}`
                            + '&fields=updated_at'
                            + '&order=updated_at%20desc'
                            + '&limit=1'
        return this.config.apiUrl + apiParams;
    }
}
