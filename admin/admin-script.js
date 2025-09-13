document.addEventListener("DOMContentLoaded", () => {

  // --- Login controlado por backend ---
  // El backend decide si el login está habilitado (por variable de entorno segura)
  let loginEnabled = true; // default

  async function checkLoginConfig() {
    try {
      const res = await fetch("/.netlify/functions/admin-auth-config", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        loginEnabled = !!data.loginEnabled;
      }
    } catch (e) {
      // Si falla, por seguridad, loginEnabled queda true
    }
    initAuthFlow();
  }

  function initAuthFlow() {
    // --- Netlify Identity Auth ---
    const adminProtected = document.getElementById("adminProtected");
    const loginPrompt = document.getElementById("loginPrompt");
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    function showAdminPanel() {
      if (adminProtected) adminProtected.style.display = "block";
      if (loginPrompt) loginPrompt.style.display = "none";
    }
    function showLoginPrompt() {
      if (adminProtected) adminProtected.style.display = "none";
      if (loginPrompt) loginPrompt.style.display = "block";
    }

    if (!loginEnabled) {
      showAdminPanel();
      return;
    }

    if (window.netlifyIdentity) {
      window.netlifyIdentity.on("init", user => {
        if (user) {
          showAdminPanel();
        } else {
          showLoginPrompt();
        }
      });
      window.netlifyIdentity.on("login", user => {
        showAdminPanel();
      });
      window.netlifyIdentity.on("logout", () => {
        showLoginPrompt();
      });
      window.netlifyIdentity.init();
      if (loginBtn) {
        loginBtn.onclick = () => {
          if (window.netlifyIdentity) window.netlifyIdentity.open();
        };
      }
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          if (window.netlifyIdentity) window.netlifyIdentity.logout();
        };
      }
    }
  }

  checkLoginConfig();


  // --- DOM Element Selectors ---
  const configForm = document.getElementById("configForm");
  const sheetIdInput = document.getElementById("sheetId");
  const scoresSheetInput = document.getElementById("scoresSheet");
  const rewardsSheetInput = document.getElementById("rewardsSheet");
  const pointsSheetInput = document.getElementById("pointsSheet");
  const msgDiv = document.getElementById("msg");

  // --- Constants ---
  const API_ENDPOINT = "/.netlify/functions/admin";

  // --- Functions ---

  /**
   * Creates and animates a single falling emoji.
   */
  function createFallingItem() {
    const ITEMS = ["🍥", "🥐", "🍩"];
    const item = document.createElement("div");
    const duration = 4 + Math.random() * 6; // 4s to 10s
    const fontSize = 22 + Math.random() * 28; // 22px to 50px

    item.classList.add("falling-item");
    item.textContent = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    item.style.left = `${Math.random() * 100}vw`;
    item.style.animationDuration = `${duration}s`;
    item.style.fontSize = `${fontSize}px`;
    
    document.body.appendChild(item);

    // Remove the item from the DOM after its animation is complete
    setTimeout(() => {
      item.remove();
    }, duration * 1000);
  }

  /**
   * Fetches and displays the current configuration on page load.
   */
  async function loadConfig() {
    // Check if elements exist before using them
    if (!msgDiv || !sheetIdInput) {
      console.error("Required elements for loadConfig are not found in the DOM.");
      return;
    }
    msgDiv.textContent = "Loading current configuration...";
    try {
      const response = await fetch(API_ENDPOINT);
      if (!response.ok) {
        throw new Error("Could not fetch config from the server.");
      }
      
      const data = await response.json();
      if (data.sheetId) {
        sheetIdInput.value = data.sheetId;
        msgDiv.textContent = "Current configuration loaded.";
      } else {
        msgDiv.textContent = "Enter a Spreadsheet ID to get started.";
      }
      if (data.scoresSheetName && scoresSheetInput) {
        scoresSheetInput.value = data.scoresSheetName;
      }
      if (data.rewardsSheetName && rewardsSheetInput) {
        rewardsSheetInput.value = data.rewardsSheetName;
      }
      if (data.pointsSheetName && pointsSheetInput) {
        pointsSheetInput.value = data.pointsSheetName;
      }
    } catch (error) {
      msgDiv.textContent = `❌ Error: ${error.message}`;
      console.error(error);
    }
  }

  /**
   * Handles the form submission to save the new configuration.
   * @param {Event} event - The form submission event.
   */
  async function handleFormSubmit(event) {
    event.preventDefault();
    const sheetId = sheetIdInput.value.trim();
    const scoresSheetName = scoresSheetInput.value.trim() || "Puntajes";
    const rewardsSheetName = rewardsSheetInput.value.trim() || "Recompensas";
    const pointsSheetName = pointsSheetInput.value.trim() || "Puntos";
    if (!sheetId) {
      msgDiv.textContent = "Please enter a valid Spreadsheet ID.";
      return;
    }
    msgDiv.textContent = "Saving...";
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, scoresSheetName, rewardsSheetName, pointsSheetName })
      });

      if (!response.ok) {
        throw new Error("Server returned an error.");
      }

      const data = await response.json();
      if (data.success) {
        msgDiv.textContent = "✅ Configuration saved successfully!";
      } else {
        throw new Error(data.message || "An unknown error occurred.");
      }
    } catch (error) {
      msgDiv.textContent = `❌ Failed to save: ${error.message}`;
      console.error(error);
    }
  }

  // --- Initialization ---

  // Make sure the form exists before adding an event listener
  if (configForm) {
    configForm.addEventListener("submit", handleFormSubmit);
  } else {
    console.error("Configuration form not found in the DOM.");
  }


  // Quitar la lluvia de emojis en admin panel (no iniciar animación)

  // Load the initial configuration
  loadConfig();
  
});