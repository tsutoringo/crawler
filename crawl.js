const Crawler = require('./Crawler');
const fs = require('fs');

(async () => {
    const crawler = new Crawler('https://wiki.freeserver.pro');
    const result = await crawler.start();
    fs.writeFileSync('sitemap.xml', result, {encoding: 'utf8'});
})();
