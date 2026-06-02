const http = require("http");
const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const host = "127.0.0.1";
const port = 4173;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".mp3": "audio/mpeg",
};

const safeJoin = (basePath, targetPath) =>
  path.join(basePath, path.normalize(targetPath).replace(/^(\.\.[/\\])+/, ""));

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${host}:${port}`);
  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = decodeURIComponent(requestedPath);
  const fileCandidates = [
    safeJoin(rootDir, safePath),
    safeJoin(path.join(rootDir, "public"), safePath),
  ];

  if (fileCandidates.some((candidate) => !candidate.startsWith(rootDir))) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  const tryReadFile = (index = 0) => {
    const filePath = fileCandidates[index];

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === "ENOENT" && index < fileCandidates.length - 1) {
          tryReadFile(index + 1);
          return;
        }

        if (error.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }

        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Server error");
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": mimeTypes[extension] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(content);
    });
  };

  tryReadFile();
});

server.listen(port, host, () => {
  console.log(`Dulcinea invite running at http://${host}:${port}`);
});
