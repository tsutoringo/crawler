const {EventEmitter} = require('events');
const puppeteer      = require('puppeteer');
const url            = require('url');
const xml            = require('xml');

class Crawler extends EventEmitter {
    constructor (baseURL) {
        super();
        this.baseURL = new URL(baseURL);
        this.scanned = new Map();
        this.ignoreHash = true
    }

    async start () {
        console.info('Launching...');
        this.browser = await puppeteer.launch();
        console.info('Complete!');
        console.info('New page...');
        this.page    = await this.browser.newPage();
        await this.crawl(this.baseURL);

        console.log(Array.from(this.scanned.keys()).map(u => ({
            url: [
                {loc: u}
            ]
        })));

        const result = xml({
            urlset: [
                {_attr: {xmlns: 'https://www.sitemaps.org/schemas/sitemap/0.9/'}},
                ...Array.from(this.scanned.keys()).map(u => ({
                    url: [
                        {loc: u}
                    ]
                }))
            ]
        })
        console.log(result);

        return result;

    }

    /**
     * 
     * @param {URL} targetURL 
     */
    async crawl (targetURL) {
        if (!targetURL.href.startsWith(this.baseURL.href)) {
            // console.log(`URLが違います: ${targetURL.href}`);
            return;
        };
        if (this.scanned.get(targetURL.href)) {
            // console.log(`スキャン済み: ${targetURL.href}`);
            return;
        }
        console.log('============================================')
        console.log('scanning: ' + targetURL.href);
        this.scanned.set(targetURL.href, true);

        const page = await this.browser.newPage();
        await page.goto(targetURL.href, {waitUntil: 'networkidle2'});

        const urls = await page.$$eval("a[href]", (list) => list.map((elm) => elm.href));

        console.log(urls);

        page.close();

        for (const u of urls) {
            const scanTargetURL  = new URL(url.resolve(targetURL.href, u));
            await this.crawl(new URL(this.ignoreHash ? scanTargetURL.origin + scanTargetURL.pathname:scanTargetURL.href));
        }
    }
}

module.exports = Crawler;