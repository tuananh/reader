const render = parsed => `<!DOCTYPE html>
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
            <h2>A reader mode sharable url built with Cloudflare workers</h2>
            <i>If you find a bug with the generated text, please find an issue over <a href="https://github.com/tuananh/reader/issues/new" target="_blank" rel="noopener">GitHub</a>.</i>
        </div>
        </hr>

        <h1>${parsed.title}</h1>
        <strong>${parsed.byline}</strong>
        ${parsed.content}
    </body>
</html>
`

module.exports = render