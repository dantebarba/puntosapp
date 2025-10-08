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
    const loginErrorMessage = document.getElementById("loginErrorMessage");

    loginErrorMessage.hidden = true;
    loginErrorMessage.textContent = "";


    function showLoginErrorMessage() {
      // Error message format https://myapp.app/admin/#error=access_denied&error_description=Signups+not+allowed+for+this+instance
      // load the error message into the loginErrorMessage label
      const hash = window.location.hash;
      if (hash.includes("error=")) {
        const params = new URLSearchParams(hash.slice(1)); // remove the #
        const error = params.get("error");
        const description = params.get("error_description");
        let message = "Error during login:";
        if (error) {
          message += ` ${error.replace(/_/g, " ")}.`;
        }
        if (description) {
          message += ` ${description.replace(/\+/g, " ")}.`;
        }
        if (loginErrorMessage) {
          loginErrorMessage.textContent = message;
          loginErrorMessage.hidden = false;
        }
      }
    }
    function showAdminPanel() {
      if (adminProtected) adminProtected.style.display = "block";
      if (loginPrompt) loginPrompt.style.display = "none";
      loadConfig();
    }
    function showLoginPrompt() {
      if (loginErrorMessage) showLoginErrorMessage();
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

  /**
   * Fetches and displays the current configuration on page load.
   */
  async function loadConfig() {
    // Check if elements exist before using them
    if (!msgDiv || !sheetIdInput) {
      console.error("Required elements for loadConfig are not found in the DOM.");
      return;
    }
    msgDiv.textContent = "Cargando configuración actual...";
    try {
      // Helper: build Authorization header if login is enabled and a user is logged in
      async function getAuthHeaders() {
        if (!loginEnabled || !window.netlifyIdentity) return {};
        const user = window.netlifyIdentity.currentUser?.();
        if (!user) return {};
        const token = await user.jwt();
        return { Authorization: `Bearer ${token}` };
      }

      const headers = await getAuthHeaders();
      const response = await fetch(API_ENDPOINT, { headers, cache: "no-store" });
      if (!response.ok) {
        throw new Error("No se pudo cargar la configuración.");
      }

      const data = await response.json();
      if (data.sheetId) {
        sheetIdInput.value = data.sheetId;
        msgDiv.textContent = "✅ Configuración cargada.";
      } else {
        msgDiv.textContent = "Ingresa la identificación de tu hoja de cálculo para comenzar.";
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
      // Helper: build Authorization header if login is enabled and a user is logged in
      async function getAuthHeaders() {
        if (!loginEnabled || !window.netlifyIdentity) return {};
        const user = window.netlifyIdentity.currentUser?.();
        if (!user) return {};
        const token = await user.jwt();
        return { Authorization: `Bearer ${token}` };
      }

      const authHeaders = await getAuthHeaders();
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ sheetId, scoresSheetName, rewardsSheetName, pointsSheetName })
      });

      if (!response.ok) {
        throw new Error("Server returned an error.");
      }

      const data = await response.json();
      if (data.success) {
        msgDiv.textContent = "✅ La configuración fue guardada correctamente!";
      } else {
        throw new Error(data.message || "Ha ocurrido un error.");
      }
    } catch (error) {
      msgDiv.textContent = `❌ Falló al guardar: ${error.message}`;
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
});