const Readability = require('readability')
const { JSDOMParser } = require('readability/JSDOMParser')

addEventListener('fetch', event => {
    event.respondWith(fetchAndLog(event.request))
})

const toBeRemovedTags = ['head', 'script', 'style', 'noscript', 'iframe']
// attempt to use htmlrewriter to cleanup the html first.
class ElementHandler {
    element(element) {
        if (toBeRemovedTags.includes(element.tagName)) {
            element.remove()
        }
    }

    comments(comment) {
        comment.remove()
    }
}

const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }

// without sanitize :-o
const t = (html) =>  `<!DOCTYPE html>
<html>
    <head>
        <link rel="stylesheet" href="//fonts.googleapis.com/css?family=Roboto:300,300italic,700,700italic">
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/normalize/5.0.0/normalize.css">
        <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/milligram/1.3.0/milligram.css">
    </head>
    <body style="max-width: 800px; margin: 0 auto;">
        <h2 style="text-align: center">A reader mode sharable url built with Cloudflare workers</h2 style="align: center">
        <p>If you find a bug with the generated text, please find an issue over <a href="https://github.com/tuananh/reader/issues">GitHub</a>.</p>
        </hr>
        ${html}
    </body>
</html>
`
async function fetchAndLog(request) {
    const url = new URL(request.url).searchParams.get('url')
    if (!url) {
        const responseInit = {
            status: 400,
            headers: htmlHeaders
        }
        return new Response('Error: missing url. Eg: https://reader.tuananh.net/?url=https://www.theverge.com/2020/2/5/21124201/bill-simmons-the-ringer-spotify-acquistion-podcast-purchase', responseInit)
    }

    const oldResp = await fetch(url, {cf: { cacheTtl: 300 }})
    const newResp = new HTMLRewriter()
        .on('*', new ElementHandler())
        .transform(oldResp)
    const text = await newResp.text()

    // console.log('resp text:', text)

    const responseInit = {
        status: 200,
        headers: htmlHeaders
    }
    
    // return new Response(text, responseInit)

    const doc = new JSDOMParser().parse(text, 'http://fakehost/')
    const reader = new Readability(doc)
    const article = reader.parse()

    return new Response(t(article.content), responseInit)
}
