const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");

const DATA_FILE = "data.json";
const PORT = 3000;

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ participants: [], drawn: [], records: [] }));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const nameOverrides = {
  Tati: "Sarah",
  Judith: "Guil",
  Guil: "Shmuel",
  Shmuel: "Papa",
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === "/data" && req.method === "GET") {
    const data = loadData();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } else if (pathname === "/draw" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { drawer } = JSON.parse(body);
      const data = loadData();

      if (!drawer || !data.participants.includes(drawer)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or non-participant name." }));
        return;
      }

      if (data.records.some((record) => record.drawer === drawer)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "You have already drawn a name." }));
        return;
      }

      let recipient;
      if (nameOverrides[drawer]) {
        recipient = nameOverrides[drawer];
        // Remove the recipient from participants
        data.participants = data.participants.filter((p) => p !== recipient);
      } else {
        const remaining = data.participants.filter(
          (p) => !data.drawn.includes(p) && p !== drawer
        );

        if (remaining.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "All names have been drawn." }));
          return;
        }

        recipient = remaining[Math.floor(Math.random() * remaining.length)];
        // Remove the recipient from participants
        data.participants = data.participants.filter((p) => p !== recipient);
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ recipient }));
    });
  } else if (pathname === "/confirm" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const { drawer, recipient } = JSON.parse(body);
      const data = loadData();

      if (
        !drawer ||
        !recipient ||
        !data.participants.includes(drawer) ||
        !data.participants.includes(recipient)
      ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid data." }));
        return;
      }

      if (data.records.some((record) => record.drawer === drawer)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "You have already confirmed a draw." }));
        return;
      }

      data.drawn.push(recipient);
      data.records.push({ drawer, recipient });
      saveData(data);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    });
  } else if (pathname === "/" && req.method === "GET") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(content);
      }
    });
  } else if (pathname === "/script.js" && req.method === "GET") {
    const filePath = path.join(__dirname, "script.js");
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      } else {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(content);
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
