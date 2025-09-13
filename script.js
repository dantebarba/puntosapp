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

  const congratsLabel = document.getElementById("congratsLabel");
  if (!userId) {
    userNameH1.textContent = "¡Bienvenido!";
    pointsDiv.textContent = "";
    if (userForm) userForm.style.display = "block";
    if (userError) userError.textContent = "";
    pointsDiv.classList.remove("loading");
    if (congratsLabel) congratsLabel.style.display = "none";
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


    // Calcular el premio canjeable en el frontend usando la tabla de rewards
    if (congratsLabel) {
      congratsLabel.style.display = "none";
      let puntos = parseInt(data.puntos, 10) || 0;
      try {
        const rewardsRes = await fetch("/.netlify/functions/rewards");
        if (rewardsRes.ok) {
          const rewards = await rewardsRes.json();
          if (Array.isArray(rewards) && rewards.length > 0) {
            // Filtrar premios con puntos numéricos
            const rewardsList = rewards
              .filter(r => r.puntos && !isNaN(parseInt(r.puntos, 10)))
              .map(r => ({ ...r, puntos: parseInt(r.puntos, 10) }))
              .sort((a, b) => a.puntos - b.puntos);
            // Premios que puede canjear
            const canjeables = rewardsList.filter(r => puntos >= r.puntos);
            if (canjeables.length > 0) {
              const premio = canjeables[canjeables.length - 1].descripcion;
              congratsLabel.innerHTML = `
                <div style=\"background:#fff7e6;border:2px solid #b85c38;color:#b85c38;padding:18px 16px;margin:18px 0 0 0;border-radius:12px;font-size:19px;font-family:Montserrat,Arial,sans-serif;text-align:center;box-shadow:0 2px 8px #b85c3822;\">
                  <div style=\"font-weight:700;font-size:21px;margin-bottom:6px;\">¡Felicitaciones!, tenés <span style='color:#e07a5f;'>${premio}</span> gratis!</div>
                  <div style=\"font-size:16px;margin-top:6px;\">
                    Canjea tus premios haciendo <a href=\"https://linktr.ee/rolurolls?utm_source=linktree_profile_share&ltsid=b1188bdf-7249-44de-a87b-f3f74a5da3f1\" style=\"color:#b85c38;text-decoration:underline;font-weight:600;\">click aquí</a>
                  </div>
                </div>
              `;
              congratsLabel.style.display = "block";
            } else {
              // Buscar el próximo premio que puede canjear
              const next = rewardsList.find(r => puntos < r.puntos);
              if (next) {
                const falta = next.puntos - puntos;
                congratsLabel.innerHTML = `
                  <div style=\"background:#fff7e6;border:2px solid #b85c38;color:#b85c38;padding:18px 16px;margin:18px 0 0 0;border-radius:12px;font-size:19px;font-family:Montserrat,Arial,sans-serif;text-align:center;box-shadow:0 2px 8px #b85c3822;\">
                    <div style=\"font-weight:700;font-size:21px;margin-bottom:6px;\">¡Te faltan <span style='color:#e07a5f;'>${falta}</span> puntos para llegar a <span style='color:#e07a5f;'>${next.descripcion}</span> gratis!</div>
                    <div style=\"font-size:16px;margin-top:6px;\">
                      Hace tu próximo pedido haciendo <a href=\"https://linktr.ee/rolurolls?utm_source=linktree_profile_share&ltsid=b1188bdf-7249-44de-a87b-f3f74a5da3f1\" style=\"color:#b85c38;text-decoration:underline;font-weight:600;\">click aquí</a>
                    </div>
                  </div>
                `;
                congratsLabel.style.display = "block";
              }
            }
          }
        }
      } catch (e) {
        // Si falla, no mostrar nada
      }
    }

    // Mostrar tabla de premios y tabla de puntos
    showRewardsTable();
    showPointsTable();
// Consulta y muestra la tabla de puntos debajo de la tabla de premios
async function showPointsTable() {
  const container = document.getElementById("pointsTableContainer");
  if (!container) return;
  const title = '<button id="togglePointsTable" style="width:100%;text-align:left;color:#b85c38;font-size:20px;margin:0 0 8px 0;padding:14px 16px;background:#fff;border:2px solid #b85c38;outline:none;cursor:pointer;display:flex;align-items:center;gap:8px;border-radius:10px;box-sizing:border-box;transition:background 0.2s, border-color 0.2s;"><span style="font-weight:bold;">Puntos</span><span id="arrowPoints" style="margin-left:auto;transition:transform 0.2s;transform:rotate(-90deg);">▼</span></button>';
    container.innerHTML = title + '<div id="pointsTableContent" class="collapsible-content" style="display:block;"><div class="loading">Cargando tabla de puntos...</div></div>';
  try {
    const res = await fetch("/.netlify/functions/purchase-points");
    if (!res.ok) throw new Error("No se pudo obtener la tabla de puntos");
    const points = await res.json();
    const content = document.getElementById("pointsTableContent");
    if (!Array.isArray(points) || points.length === 0) {
      if (content) content.innerHTML = '<div class="loading">No hay configuración de puntos.</div>';
      return;
    }
    // Mostrar solo columnas Descripcion, Cantidad, Puntaje
    const allowedHeaders = ["descripcion", "cantidad", "puntaje"];
    let table = '<table style="width:100%;margin-top:12px;border-collapse:collapse;"><thead><tr>';
      allowedHeaders.forEach(h => {
        const align = h.toLowerCase() === "descripcion" ? "left" : "center";
        table += `<th style='border-bottom:1px solid #eee;padding:6px 4px;text-align:${align};font-size:15px;color:#b85c38;'>${h.charAt(0).toUpperCase() + h.slice(1)}</th>`;
    });
    table += '</tr></thead><tbody>';
    points.forEach(row => {
      table += '<tr>';
      allowedHeaders.forEach(h => {
        const align = h === "descripcion" ? "left" : "center";
        table += `<td style='padding:6px 4px;font-size:15px;text-align:${align};'>${row[h] || ''}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';
  if (content) content.innerHTML = table + '<div style="text-align:left;font-size:13px;color:#b85c38;margin-top:6px;font-family:Montserrat,Arial,sans-serif">(*) por única vez</div>';
  } catch (err) {
  const content = document.getElementById("pointsTableContent");
  if (content) content.innerHTML = `<div class='loading'>Error al cargar tabla de puntos</div>`;
  }
}
// Consulta y muestra la tabla de premios debajo del puntaje
async function showRewardsTable() {
  const container = document.getElementById("rewardsTableContainer");
  if (!container) return;
  const title = '<button id="toggleRewardsTable" style="width:100%;text-align:left;color:#b85c38;font-size:20px;margin:0 0 8px 0;padding:14px 16px;background:#fff;border:2px solid #b85c38;outline:none;cursor:pointer;display:flex;align-items:center;gap:8px;border-radius:10px;box-sizing:border-box;transition:background 0.2s, border-color 0.2s;"><span style="font-weight:bold;">Premios</span><span id="arrowRewards" style="margin-left:auto;transition:transform 0.2s;transform:rotate(-90deg);">▼</span></button>';
  container.innerHTML = title + '<div id="rewardsTableContent" class="collapsible-content" style="display:block;"><div class="loading">Cargando premios...</div></div>';
  try {
    const res = await fetch("/.netlify/functions/rewards");
    if (!res.ok) throw new Error("No se pudo obtener la tabla de premios");
    const rewards = await res.json();
    const content = document.getElementById("rewardsTableContent");
    if (!Array.isArray(rewards) || rewards.length === 0) {
      if (content) content.innerHTML = '<div class="loading">No hay premios configurados.</div>';
      return;
    }
    // Mostrar solo columnas Descripcion y Puntos
    const allowedHeaders = ["descripcion", "puntos"];
    let table = '<table style="width:100%;margin-top:12px;border-collapse:collapse;"><thead><tr>';
      allowedHeaders.forEach(h => {
        const align = h.toLowerCase() === "descripcion" ? "left" : "center";
        table += `<th style='border-bottom:1px solid #eee;padding:6px 4px;text-align:${align};font-size:15px;color:#b85c38;'>${h.charAt(0).toUpperCase() + h.slice(1)}</th>`;
    });
    table += '</tr></thead><tbody>';
    rewards.forEach(row => {
      table += '<tr>';
      allowedHeaders.forEach(h => {
          const align = h.toLowerCase() === "descripcion" ? "left" : "center";
          table += `<td style='padding:6px 4px;font-size:15px;text-align:${align};'>${row[h] || ''}</td>`;
      });
      table += '</tr>';
    });
    table += '</tbody></table>';
  if (content) content.innerHTML = table  + '<div style="text-align:left;font-size:13px;color:#b85c38;margin-top:6px;font-family:Montserrat,Arial,sans-serif">(*) canje minimo 300 pts</div>';
  } catch (err) {
  const content = document.getElementById("rewardsTableContent");
  if (content) content.innerHTML = `<div class='loading'>Error al cargar premios</div>`;
  }
}

  } catch (error) {
    if (congratsLabel) congratsLabel.style.display = "none";
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

  // Handler para colapsar/expandir tablas
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "toggleRewardsTable") {
      const content = document.getElementById("rewardsTableContent");
      const arrow = document.getElementById("arrowRewards");
      if (content) {
        const isOpen = content.classList.contains("open");
        if (isOpen) {
          content.classList.remove("open");
            if (arrow) arrow.style.transform = "rotate(-90deg)";
        } else {
          content.classList.add("open");
            if (arrow) arrow.style.transform = "rotate(0deg)";
        }
      }
    }
    if (e.target && e.target.id === "togglePointsTable") {
      const content = document.getElementById("pointsTableContent");
      const arrow = document.getElementById("arrowPoints");
      if (content) {
        const isOpen = content.classList.contains("open");
        if (isOpen) {
          content.classList.remove("open");
            if (arrow) arrow.style.transform = "rotate(-90deg)";
        } else {
          content.classList.add("open");
            if (arrow) arrow.style.transform = "rotate(0deg)";
        }
      }
    }
  });
});