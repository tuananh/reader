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

// without sanitize :-o
const render = (parsed) =>  `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${parsed.title}</title>
        <meta name="description" content="${parsed.excerpt}">
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
            @media (prefers-color-scheme: dark) {
                body {
                    background-color: black;
                    color: #ccc;
                }
                h1, h2, strong {
                    color: #e0e0e0;
                }
            }
        </style>
    </head>
    <body>
        <div style="text-align: center">
            <h2 style="text-align: center">A reader mode sharable url built with Cloudflare workers</h2 style="align: center">
            <i>If you find a bug with the generated text, please find an issue over <a href="https://github.com/tuananh/reader/issues/new" target="_blank" rel="noopener">GitHub</a>.</i>
        </div>
        </hr>

        <h2>${parsed.title}</h2>
        ${parsed.content}
    </body>
</html>
`

const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' }
const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
}
async function fetchAndLog(request) {
    const url = new URL(request.url).searchParams.get('url')    
    if (!url) {
        const responseInit = {
            status: 400,
            headers: htmlHeaders
        }
        return new Response('Error: missing url. Eg: https://reader.tuananh.net/?url=https://www.theverge.com/2020/2/5/21124201/bill-simmons-the-ringer-spotify-acquistion-podcast-purchase', responseInit)
    }

    const oldResp = await fetch(url, {...fetchHeaders, cf: { cacheTtl: 3000 }})
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
    const reader = new Readability(doc, {
        charThreshold: 2000
    })
    const article = reader.parse()    

    return new Response(render(article), responseInit)
}
