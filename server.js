const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = "data.json";

// Active CORS pour toutes les origines
app.use(cors());  // Permet d'autoriser toutes les origines

// Si tu veux limiter à une origine spécifique, utilise la configuration suivante :
/*
app.use(cors({
  origin: 'https://ton-site-frontend.com' // Remplace par l'URL de ton site frontend
}));
*/

app.use(bodyParser.json());

function loadData() {
  const data = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(data);
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/data", (req, res) => {
  const data = loadData();
  res.json(data);
});

app.post("/draw", (req, res) => {
  const { drawer } = req.body;
  const data = loadData();

  if (!drawer || !data.participants.includes(drawer)) {
    return res.status(400).json({ error: "Nom invalide ou non participant." });
  }
  if (data.records.some((record) => record.drawer === drawer)) {
    return res.status(400).json({ error: "Vous avez déjà tiré un nom." });
  }

  const remaining = data.participants.filter(
    (p) => !data.drawn.includes(p) && p !== drawer
  );
  if (remaining.length === 0) {
    return res.status(400).json({ error: "Tous les noms ont déjà été tirés." });
  }

  const recipient = remaining[Math.floor(Math.random() * remaining.length)];
  res.json({ recipient });
});

app.post("/confirm", (req, res) => {
  const { drawer, recipient } = req.body;
  const data = loadData();

  if (
    !drawer ||
    !recipient ||
    !data.participants.includes(drawer) ||
    !data.participants.includes(recipient)
  ) {
    return res.status(400).json({ error: "Données invalides." });
  }
  if (data.records.some((record) => record.drawer === drawer)) {
    return res.status(400).json({ error: "Vous avez déjà confirmé un tirage." });
  }

  data.drawn.push(recipient);
  data.records.push({ drawer, recipient });
  saveData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
