document.addEventListener("DOMContentLoaded", () => {
  // --- IMPORTANT: UPDATE THIS URL ---
  // This should be the public URL of your main rewards points page.
  // Usar solo el origen y pathname para evitar duplicar parámetros
  const BASE_URL = window.location.origin;

  // --- DOM Element Selectors ---
  const qrCodeContainer = document.getElementById("qrCodeContainer");
  const downloadLink = document.getElementById("downloadLink");
  const msgDiv = document.getElementById("msg");
  const titleH1 = document.getElementById("title");
  const qrResultDiv = document.getElementById("qrResult");

  /**
   * Reads the 'user' query parameter from the URL and generates a QR code.
   */
  const generateQRCodeFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user");

    if (!userId) {
      titleH1.textContent = "Error";
      msgDiv.textContent = "No user ID provided. Please add '?user=USER_ID' to the end of the URL.";
      qrResultDiv.style.display = 'none'; // Hide the QR section on error
      return;
    }

    // Construct the final URL for the QR code
    const finalUrl = `${BASE_URL}?user=${encodeURIComponent(userId)}`;

    // Get computed background color from CSS variables
    const cardBackground = getComputedStyle(document.documentElement)
      .getPropertyValue('--card-background').trim();

    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-text-color').trim();

    console.log(cardBackground, textColor);
    
    // Generate the QR code
    const qr = new QRCode(qrCodeContainer, {
      text: finalUrl,
      width: 256,
      height: 256,
      colorDark: textColor, // Using primary text color
      colorLight: cardBackground, // Using card background color with fallback
      correctLevel: QRCode.CorrectLevel.H,
    });

    titleH1.textContent = `Guardá tu QR y sumá puntos!`;
    msgDiv.textContent = "Escanea el código QR para acceder a tus puntos";

    // Set up the download link after a short delay to ensure the canvas is rendered
    setTimeout(() => {
      const canvas = qrCodeContainer.querySelector("canvas");
      if (canvas) {
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.download = `qr-code-${userId}.png`;
      } else {
        downloadLink.style.display = 'none';
        msgDiv.textContent = "Error: Could not create download link.";
      }
    }, 200);
  };

  // --- Initialize ---
  // Generate the QR code as soon as the page is ready.
  generateQRCodeFromURL();
});
