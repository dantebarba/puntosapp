// --- Element Selectors ---
const pointsDiv = document.getElementById("points");
const userNameH1 = document.getElementById("userName");

/**
 * Fetches and displays user points from an API.
 */

async function loadPoints(userIdFromForm) {
  const params = new URLSearchParams(window.location.search);
  let userId = params.get("user");
  const userForm = document.getElementById("userForm");
  const userError = document.getElementById("userError");
  const userSubmitBtn = document.getElementById("userSubmitBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  if (!userId && userIdFromForm) userId = userIdFromForm;

  if (!userId) {
    userNameH1.textContent = "¡Bienvenido!";
    pointsDiv.textContent = "";
    if (userForm) userForm.style.display = "block";
    if (userError) userError.textContent = "";
    pointsDiv.classList.remove("loading");
    return;
  } else {
    if (userForm) userForm.style.display = "none";
    if (userError) userError.textContent = "";
  }
  if (userSubmitBtn && btnText && btnSpinner) {
    userSubmitBtn.disabled = true;
    btnText.style.display = "none"; // Hide text
    btnSpinner.style.display = "inline-block"; // Show spinner
  }

  try {
    const response = await fetch(`/.netlify/functions/points?userid=${userId}`);

    if (!response.ok) {
      const message = response.status === 404 ? "User not found" : `Server error: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

  userNameH1.textContent = `Hola, ${data.nombre || 'Invitado'}!`;
  pointsDiv.textContent = `${data.puntos || 0} pts`;
  if (userError) userError.textContent = "";

  } catch (error) {
    if (error.message && error.message.includes("User not found")) {
      if (userError) userError.textContent = "Usuario no encontrado. Verificá el código e intentá nuevamente.";
      if (userForm) userForm.style.display = "block";
      userNameH1.textContent = "¡Bienvenido!";
      pointsDiv.textContent = "";
    } else {
      userNameH1.textContent = "Error";
      pointsDiv.textContent = error.message;
    }
    console.error("No se pudieron cargar los puntos:", error);
  } finally {
    pointsDiv.classList.remove("loading");
    if (userSubmitBtn && btnText && btnSpinner) {
      userSubmitBtn.disabled = false;
      btnText.style.display = "inline-block"; // Show text again
      btnSpinner.style.display = "none"; // Hide spinner
    }
  }
}

/**
 * Creates and animates a single falling cinnamon roll image.
 */
function createFallingItem() {
  // --- Configuration ---
  const CINNAMON_ROLL_URL = "https://res.cloudinary.com/dctrptn13/image/upload/v1757727506/cinnamon-roll_a3idun.png";
  const MIN_DURATION = 5; // seconds
  const MAX_DURATION = 12; // seconds
  const MIN_SIZE = 30; // pixels
  const MAX_SIZE = 70; // pixels

  const item = document.createElement("img");
  const duration = Math.random() * (MAX_DURATION - MIN_DURATION) + MIN_DURATION;
  const size = Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE;

  item.src = CINNAMON_ROLL_URL;
  item.classList.add("falling-cinnamon-roll");
  
  item.style.width = `${size}px`;
  item.style.height = 'auto';
  item.style.left = `${Math.random() * 100}vw`;
  item.style.animationDuration = `${duration}s`;
  
  document.body.appendChild(item);

  // --- NEW LOGIC ---
  // When the fade-out transition finishes, remove the element.
  item.addEventListener('transitionend', () => {
    item.remove();
  });

  // Start the fade-out 1 second before the fall animation ends.
  // The 1000ms value must match the transition duration in the CSS.
  setTimeout(() => {
    item.style.opacity = '0';
  }, (duration * 1000) - 1000);
}

// --- Initialize ---

// Manejar el formulario para ingresar el código de usuario
document.addEventListener("DOMContentLoaded", () => {
  const userForm = document.getElementById("userForm");
  const userError = document.getElementById("userError");

  if (userForm) {
    userForm.addEventListener("submit", function(e) {
      e.preventDefault();
      if (userError) userError.textContent = "";
      const userInput = document.getElementById("userInput").value.trim();
      if (userInput) {
        loadPoints(userInput);
        // Opcional: actualizar la URL para reflejar el parámetro
        const url = new URL(window.location);
        url.searchParams.set("user", userInput);
        window.history.replaceState({}, '', url);
      }
    });
  }
  loadPoints();
  setInterval(createFallingItem, 400);
});