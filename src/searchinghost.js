import FlexSearch from 'flexsearch';

export default class SearchinGhost {

    constructor(args) {
        this.config = {
            url: window.location.origin,
            key: '',
            version: 'v3',
            inputId: 'search-bar',
            outputId: 'search-results',
            outputElementType: 'div',
            template: function(post) {
                return `<a href="${post.url}">
                <figure>
                    <img src="${post.feature_image}">
                </figure>
                <section>
                    <header>#${post.tags} - ${post.published_at}</header>
                    <h2>${post.title}</h2>
                    <p>${post.excerpt}</p>
                </section>
                </a>`
            },
            date: {
                locale: 'fr-FR',
                options: { year: 'numeric', month: 'short', day: 'numeric' }
            },
            debug: false
        }

        this.buildConfig(args);

        this.dataLoaded = false;
        this.storage = localStorage;

        // init the search engine
        this.initIndex();
        
        // Add listeners to trigger event from search bar
        this.setEventListners();
    }

    buildConfig(args) {
        for (let [key, value] of Object.entries(args)) {
            this.config[key] = value;
        }
        this.config.apiUrl = `${this.config.url}/ghost/api/${this.config.version}/content/posts/`
    }

    initIndex() {
        this.index = new FlexSearch({
            "doc": {
                "id": "id",
                "field": [
                    "title",
                    "primary_tag",
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

        let searchForm = searchBar.closest('form');
        if (searchForm !== null) {
            searchForm.addEventListener("submit", (e) => {
                e.preventDefault();
            });
        }

        searchBar.addEventListener('focus', () => {
            if (!this.dataLoaded) {
                this.loadResources();
            }
        });

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
            console.debug("Load locally stored index");
            this.index.import(storedIndex);
            this.dataLoaded = true;
            this.validateCache();
        } else {
            this.fetch();
            this.dataLoaded = true;
        }
    }

    reformat(posts) {
        posts.forEach((post, id) => {
            post.id = id;
            post.published_at = this.prettyDate(post.published_at);
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
        console.debug("Start fetching posts from Ghost");
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
            console.debug("Cached data now updated & stored locally");
        }).catch(error => {
            console.error("Unable to fetch and store post resources", error);
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
        console.debug("Start validating stored cache data");
        
        let storedWatermark = this.storage.getItem("SearchinGhost_watermark");
        if (storedWatermark === null) {
            return;
        } else {
            storedWatermark = new Date(storedWatermark);
        }

        let elapsedTime = Math.round((new Date() - storedWatermark) / 1000);
        if (elapsedTime < 3600) {
            console.debug(`Skip cache refreshing, updated less than 1h ago (${elapsedTime} secs)`)
            return;
        }
        
        fetch(this.getLatestPostUrl())
        .then(response => {
            return response.json();
        }).then(responseContent => {
            let storedUpdateTimestamp = this.storage.getItem("SearchinGhost_updatedat");
            let foundUpdateTimestamp = responseContent.posts[0].updated_at;
            if (foundUpdateTimestamp !== storedUpdateTimestamp) {
                console.debug("Local cache not up to date, start refreshing data");
                this.fetch();
            } else {
                console.debug("Local cache up to date");
            }
        }).catch(error => {
            console.error("Unable to fetch the latest post information", error);
        });
    }

    getAllPostsUrl() {
        const apiParams = `?key=${this.config.key}`
                            + '&fields=title,url,excerpt,custom_excerpt,published_at,updated_at,feature_image'
                            + '&include=tags,authors'
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
