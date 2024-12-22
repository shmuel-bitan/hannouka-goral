const drawerSelect = document.getElementById("drawer");
const drawButton = document.getElementById("drawButton");
const confirmButton = document.getElementById("confirmButton");
const recipientElement = document.getElementById("recipient");

const API_URL = "https://hanoukka.onrender.com"; // Change this to your backend's URL

// Load participants when the page loads
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
    console.error("Error loading participants:", error);
  }
};

// Draw a name
drawButton.onclick = async () => {
  const drawer = drawerSelect.value;
  if (!drawer) {
    alert("Please select your name.");
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
      recipientElement.textContent = `You drew: ${data.recipient}`;
      recipientElement.style.display = "block";
      confirmButton.style.display = "inline-block";
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Error drawing a name:", error);
  }
};

// Confirm the draw
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
      alert("Your draw has been confirmed!");
      recipientElement.style.display = "none";
      confirmButton.style.display = "none";
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error("Error confirming the draw:", error);
  }
};
