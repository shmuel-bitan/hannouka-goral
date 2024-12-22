const http = require("http");
const fs = require("fs");
const url = require("url");
const path = require("path");

const DATA_FILE = "data.json";
const PORT = 3000;

// Les correspondances spécifiques
const nameOverrides = {
  Tati: "Sarah",
  Judith: "Guil",
  Guil: "Shmuel",
  Shmuel: "Papa",
};

// Chargement des données depuis le fichier JSON
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ participants: [], drawn: [], records: [] }));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// Sauvegarde des données dans le fichier JSON
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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
        res.end(JSON.stringify({ error: "Nom invalide ou non participant." }));
        return;
      }

      if (data.records.some((record) => record.drawer === drawer)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Vous avez déjà tiré un nom." }));
        return;
      }

      let recipient;

      // Vérifie si un nom spécifique doit être attribué
      if (nameOverrides[drawer]) {
        recipient = nameOverrides[drawer];
      } else {
        // Liste des noms restants, excluant les noms spécifiques
        const excludedNames = Object.values(nameOverrides);
        const remaining = data.participants.filter(
          (p) => !data.drawn.includes(p) && p !== drawer && !excludedNames.includes(p)
        );

        if (remaining.length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Tous les noms disponibles ont été tirés." }));
          return;
        }

        recipient = remaining[Math.floor(Math.random() * remaining.length)];
      }

      // Supprime le destinataire des participants
      data.participants = data.participants.filter((p) => p !== recipient);

      // Répond avec le nom tiré
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
        data.records.some((record) => record.drawer === drawer)
      ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Données invalides ou tirage déjà confirmé." }));
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
        res.end("Erreur interne du serveur.");
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
        res.end("Erreur interne du serveur.");
      } else {
        res.writeHead(200, { "Content-Type": "application/javascript" });
        res.end(content);
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Page non trouvée.");
  }
});

server.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
