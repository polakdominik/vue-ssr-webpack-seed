const path = require("path");
const express = require("express");
const { createSSRApp } = require("vue");
const { renderToString } = require("@vue/server-renderer");
const manifestSSR = require("../dist/ssr/ssr-manifest.json");
const manifest = require("../dist/manifest.json");

const server = express();

const appPath = path.join(__dirname, "../dist/ssr", manifestSSR["app.js"]);
const App = require(appPath).default;

server.use("/img", express.static(path.join(__dirname, "../dist", "img")));
server.use("/js", express.static(path.join(__dirname, "../dist", "js")));
server.use("/css", express.static(path.join(__dirname, "../dist", "css")));
server.use(
  "/favicon.ico",
  express.static(path.join(__dirname, "../dist", "favicon.ico"))
);

/**
 * @param filename
 */
function getExtension(filename) {
  return filename.match('.([a-z]*)$')[1];
}

function generatePreloadLinks() {
  let links = ``;
  const types = { js: 'script', css: 'style' };

  Object.keys(manifest)
        .filter(filename => filename.endsWith('js') || filename.endsWith('css'))
        .forEach(filename =>
      links += `<link href="${manifest[filename]}" rel="preload" as="${types[getExtension(filename)]}">\n`);

  return links;
}

server.get("*", async (req, res) => {
  const app = createSSRApp(App);
  const appContent = await renderToString(app);

  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="icon" href="/favicon.ico">
        <title>vue3-ssr</title>
        ${generatePreloadLinks()}
        <link rel="stylesheet" href="${manifest['app.css']}"/>
      </head>
      <body>
          <noscript><strong>We're sorry but vue3-ssr doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript>
          <div id="app">${appContent}</div>
          <script src="${manifest['chunk-vendors.js']}"></script>
          <script src="${manifest['app.js']}"></script>
      </body>
  </html>
  `;

  res.end(html);
});

console.log(`
  You can navigate to http://localhost:8080
`);

server.listen(8080);
