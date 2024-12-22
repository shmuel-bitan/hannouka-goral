const API_URL = "https://hannouka-goral.onrender.com"; // URL de votre serveur distant

const drawerSelect = document.getElementById("drawer");
const drawButton = document.getElementById("drawButton");
const confirmButton = document.getElementById("confirmButton");
const recipientElement = document.getElementById("recipient");

// Charger les participants au chargement de la page
window.onload = async () => {
  try {
    const response = await fetch(`${API_URL}/data`);
    const data = await response.json();
    data.participants.forEach((participant) => {
      const option = document.createElement("option");
      option.value = participant;
      option.textContent = participant;
      drawerSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des participants :", error);
    alert("Impossible de charger les participants. Réessayez plus tard.");
  }
};

// Tirer un nom
drawButton.onclick = async () => {
  const drawer = drawerSelect.value;
  if (!drawer) {
    alert("Veuillez sélectionner votre nom.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawer }),
    });

    const data = await response.json();
    if (response.ok) {
      recipientElement.textContent = `Vous avez tiré : ${data.recipient}`;
      recipientElement.style.display = "block";
      confirmButton.style.display = "inline-block";
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Erreur lors du tirage :", error);
    alert("Une erreur s'est produite lors du tirage. Réessayez plus tard.");
  }
};

// Confirmer le tirage
confirmButton.onclick = async () => {
  const drawer = drawerSelect.value;
  const recipient = recipientElement.textContent.split(": ")[1];

  try {
    const response = await fetch(`${API_URL}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drawer, recipient }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Votre tirage a été confirmé !");
      recipientElement.style.display = "none";
      confirmButton.style.display = "none";
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Erreur lors de la confirmation :", error);
    alert("Une erreur s'est produite lors de la confirmation. Réessayez plus tard.");
  }
};
