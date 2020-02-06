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
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                line-height: 1.6;
                color: #222;
                max-width: 40rem;
                padding: 2rem;
                margin: auto;
                background: #fafafa;
            }

            img {
                max-width: 100%;
            }

            a {
                color: #2ECC40;
            }

            h1,
            h2,
            strong {
                color: #111;
            }
        </style>
    </head>
    <body>
        <div style="text-align: center">
            <h2 style="text-align: center">A reader mode sharable url built with Cloudflare workers</h2 style="align: center">
            <i>If you find a bug with the generated text, please find an issue over <a href="https://github.com/tuananh/reader/issues" target="_blank">GitHub</a>.</i>
        </div>
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
