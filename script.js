// --- Element Selectors ---
const pointsDiv = document.getElementById("points");
const userNameH1 = document.getElementById("userName");

/**
 * Fetches and displays user points from an API.
 */
async function loadPoints() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user");

  if (!userId) {
    userNameH1.textContent = "Error";
    pointsDiv.textContent = "Missing user parameter in URL";
    pointsDiv.classList.remove("loading");
    return;
  }

  try {
    const response = await fetch(`/.netlify/functions/points?userid=${userId}`);

    if (!response.ok) {
      const message = response.status === 404 ? "User not found" : `Server error: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

    userNameH1.textContent = `Hello, ${data.nombre || 'Guest'}!`;
    pointsDiv.textContent = `${data.puntos || 0} pts`;

  } catch (error) {
    userNameH1.textContent = "Sorry!";
    pointsDiv.textContent = error.message;
    console.error("Failed to load points:", error);
  } finally {
    pointsDiv.classList.remove("loading");
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
loadPoints();
setInterval(createFallingItem, 400);