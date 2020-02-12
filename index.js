const Readability = require('readability')
const { JSDOMParser } = require('readability/JSDOMParser')
const render = require('./render')

addEventListener('fetch', event => {
    event.respondWith(fetchAndRender(event.request))
})

const toBeRemovedTags = ['link', 'script', 'style', 'noscript', 'iframe']
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
const fetchHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
}
async function fetchAndRender(request) {
    const url = new URL(request.url).searchParams.get('url')

    if (!url) {
        const responseInit = {
            status: 400,
            headers: htmlHeaders
        }
        return new Response(
            'Error: missing url. Eg: https://reader.tuananh.net/?url=https://www.theverge.com/2020/2/5/21124201/bill-simmons-the-ringer-spotify-acquistion-podcast-purchase',
            responseInit
        )
    }
    const parsedUrl = new URL(url)
    const oldResp = await fetch(url, {
        ...fetchHeaders,
        cf: { cacheTtl: 3000 }
    })
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

    const doc = new JSDOMParser().parse(
        text,
        parsedUrl.protocol + '//' + parsedUrl.host
    )
    const reader = new Readability(doc, {
        charThreshold: 2000
    })
    const article = reader.parse()

    const contentType = request.headers.get('Content-Type')
    if (contentType && contentType.indexOf('application/json') !== -1) {
        return new Response(JSON.stringify(article), {
            'Content-Type': 'text/html; charset=utf-8'
        })
    }

    return new Response(render(article), responseInit)
}
