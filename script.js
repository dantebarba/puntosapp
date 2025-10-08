// --- Element Selectors ---
const pointsDiv = document.getElementById("points");
const userNameH1 = document.getElementById("userName");

function sanitizeNumber(input) {
  return String(input)              // ensure it's a string
    .replace(/\s+/g, '')            // remove all whitespace
    .replace(/\D+/g, '')            // keep only digits
    .replace(/^0+/, '');            // remove leading zeros
}

// HTML-escape helper for untrusted text
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}


/**
 * Fetches and displays user points from an API.
 */
async function loadPoints(userIdFromForm) {
  let unsanitizedUserId = userIdFromForm;
  if (!unsanitizedUserId) {
    // If not provided from form, fallback to URL param
    const params = new URLSearchParams(window.location.search);
    unsanitizedUserId = params.get("user");
  }
  const userId = sanitizeNumber(unsanitizedUserId);
  const userForm = document.getElementById("userForm");
  const userError = document.getElementById("userError");
  const userSubmitBtn = document.getElementById("userSubmitBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  // (No longer needed, handled above)

  const congratsLabel = document.getElementById("congratsLabel");
  if (!userId) {
    userNameH1.textContent = "¡Bienvenido!";
    pointsDiv.textContent = "";
    if (userForm) userForm.style.display = "block";
    if (userError) userError.textContent = "";
    pointsDiv.classList.remove("loading");
    if (congratsLabel) congratsLabel.style.display = "none";
    // Ocultar contenedores de tablas cuando no hay usuario
    const rewardsContainer = document.getElementById("rewardsTableContainer");
    const pointsContainer = document.getElementById("pointsTableContainer");
    if (rewardsContainer) rewardsContainer.style.display = "none";
    if (pointsContainer) pointsContainer.style.display = "none";
    return;
  } else {
    if (userForm) userForm.style.display = "none";
    if (userError) userError.textContent = "";
    // Mostrar contenedores de tablas cuando hay usuario
    const rewardsContainer = document.getElementById("rewardsTableContainer");
    const pointsContainer = document.getElementById("pointsTableContainer");
    if (rewardsContainer) rewardsContainer.style.display = "block";
    if (pointsContainer) pointsContainer.style.display = "block";
  }
  if (userSubmitBtn && btnText && btnSpinner) {
    userSubmitBtn.disabled = true;
    btnText.style.display = "none"; // Hide text
    btnSpinner.style.display = "inline-block"; // Show spinner
  }

  try {
    const response = await fetch(`/.netlify/functions/points?userid=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      const message = response.status === 404 ? "User not found" : `Server error: ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

    userNameH1.textContent = `Hola, ${data.nombre || 'Invitado'}!`;
    pointsDiv.textContent = `Tenés ${data.puntos || 0} puntos`;
    if (userError) userError.textContent = "";

    // Only update the URL if the search was successful
    if (userIdFromForm) {
      const url = new URL(window.location);
      url.searchParams.set("user", userIdFromForm);
      window.history.replaceState({}, '', url);
    }

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
              const premio = canjeables[canjeables.length - 1].descripción;
              congratsLabel.innerHTML = `
                <div class="message-container">
                  <div class="message-title">¡Felicitaciones! tenés <span class="message-highlight">${escapeHtml(premio)}</span> gratis!</div>
                  <div style="font-size:16px;margin-top:6px;">
                    Canjea tus premios haciendo <a href="https://linktr.ee/rolurolls?utm_source=linktree_profile_share&ltsid=b1188bdf-7249-44de-a87b-f3f74a5da3f1" target="_blank" rel="noopener noreferrer" class="message-link">click aquí</a>
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
                  <div class="message-container">
                    <div class="message-title">¡Te faltan <span class="message-highlight">${escapeHtml(falta)}</span> puntos para llegar a <span class="message-highlight">${escapeHtml(next.descripción)}</span> gratis!</div>
                    <div style="font-size:16px;margin-top:6px;">
                      Hace tu próximo pedido haciendo <a href="https://linktr.ee/rolurolls?utm_source=linktree_profile_share&ltsid=b1188bdf-7249-44de-a87b-f3f74a5da3f1" target="_blank" rel="noopener noreferrer" class="message-link">click aquí</a>
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
      const title = '<button id="togglePointsTable" class="table-button"><span class="card-table-title">Puntos</span><span id="arrowPoints" style="margin-left:auto;transition:transform 0.2s;transform:rotate(-90deg);">▼</span></button>';
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
        const allowedHeaders = ["descripción", "puntos"];
        let table = '<table class="data-table"><thead><tr>';
        allowedHeaders.forEach(h => {
          const align = h.toLowerCase() === "descripción" ? "text-left" : "text-center";
          table += `<th class="${align}">${h.charAt(0).toUpperCase() + h.slice(1)}</th>`;
        });
        table += '</tr></thead><tbody>';
        points.forEach(row => {
          table += '<tr>';
          allowedHeaders.forEach(h => {
            const align = h === "descripción" ? "text-left" : "text-center";
            table += `<td class="${align}">${escapeHtml(row[h] || '')}</td>`;
          });
          table += '</tr>';
        });
        table += '</tbody></table>';
        if (content) content.innerHTML = table + '<div class="data-table-notes">(*) por única vez</div>';
      } catch (err) {
        const content = document.getElementById("pointsTableContent");
        if (content) content.innerHTML = `<div class='loading'>Error al cargar tabla de puntos</div>`;
      }
    }
    // Consulta y muestra la tabla de premios debajo del puntaje
    async function showRewardsTable() {
      const container = document.getElementById("rewardsTableContainer");
      if (!container) return;
      const title = '<button id="toggleRewardsTable" class="table-button"><span class="card-table-title">Premios</span><span id="arrowRewards" style="margin-left:auto;transition:transform 0.2s;transform:rotate(-90deg);">▼</span></button>';
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
        const allowedHeaders = ["descripción", "puntos"];
        let table = '<table class="data-table"><thead><tr>';
        allowedHeaders.forEach(h => {
          const align = h.toLowerCase() === "descripción" ? "text-left" : "text-center";
          table += `<th class="${align}">${h.charAt(0).toUpperCase() + h.slice(1)}</th>`;
        });
        table += '</tr></thead><tbody>';
        rewards.forEach(row => {
          table += '<tr>';
          allowedHeaders.forEach(h => {
            const align = h.toLowerCase() === "descripción" ? "text-left" : "text-center";
            table += `<td class="${align}">${escapeHtml(row[h] || '')}</td>`;
          });
          table += '</tr>';
        });
        table += '</tbody></table>';
        if (content) content.innerHTML = table + '<div class="data-table-notes">(*) canje minimo 300 pts</div>';
      } catch (err) {
        const content = document.getElementById("rewardsTableContent");
        if (content) content.innerHTML = `<div class='loading'>Error al cargar premios</div>`;
      }
    }

  } catch (error) {
    if (congratsLabel) congratsLabel.style.display = "none";
    // Ocultar contenedores de tablas en caso de error
    const rewardsContainer = document.getElementById("rewardsTableContainer");
    const pointsContainer = document.getElementById("pointsTableContainer");
    if (rewardsContainer) rewardsContainer.style.display = "none";
    if (pointsContainer) pointsContainer.style.display = "none";

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

import { startFallingAnimation } from './js/animations.js';

// --- Initialize ---

// Manejar el formulario para ingresar el código de usuario
document.addEventListener("DOMContentLoaded", () => {
  const userForm = document.getElementById("userForm");
  const userError = document.getElementById("userError");

  if (userForm) {
    userForm.addEventListener("submit", function (e) {
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
  startFallingAnimation(400);

  // Handler para colapsar/expandir tablas
  document.addEventListener("click", (e) => {
    const rewardsBtn = e.target.closest && e.target.closest("button#toggleRewardsTable");
    if (rewardsBtn) {
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
    const pointsBtn = e.target.closest && e.target.closest("button#togglePointsTable");
    if (pointsBtn) {
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