// --- Configuration ---
export const ANIMATION_CONFIG = {
  CINNAMON_ROLL_URL: "https://res.cloudinary.com/dctrptn13/image/upload/v1757727506/cinnamon-roll_a3idun.png",
  MIN_DURATION: 5, // seconds
  MAX_DURATION: 12, // seconds
  MIN_SIZE: 30, // pixels
  MAX_SIZE: 70, // pixels
  POOL_SIZE: 10 // number of reusable elements
};

// Cache for reusable elements
class ElementPool {
  constructor() {
    this.elements = [];
    this.image = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    // Preload the image
    this.image = new Image();
    await new Promise((resolve, reject) => {
      this.image.onload = resolve;
      this.image.onerror = reject;
      this.image.src = ANIMATION_CONFIG.CINNAMON_ROLL_URL;
    });

    // Create pool of reusable elements
    for (let i = 0; i < ANIMATION_CONFIG.POOL_SIZE; i++) {
      const element = document.createElement('img');
      element.classList.add('falling-cinnamon-roll');
      element.src = ANIMATION_CONFIG.CINNAMON_ROLL_URL;
      element.style.display = 'none';
      document.body.appendChild(element);
      this.elements.push(element);

      // Clean up when animation ends
      element.addEventListener('transitionend', () => {
        element.style.display = 'none';
        element.style.opacity = '1';
        this.elements.push(element);
      });
    }
    
    this.initialized = true;
  }

  get() {
    return this.elements.pop();
  }
}

export const elementPool = new ElementPool();

/**
 * Creates and animates a single falling cinnamon roll image.
 */
export async function createFallingAnimation() {
  if (!elementPool.initialized) {
    await elementPool.init();
  }

  const item = elementPool.get();
  if (!item) return; // Pool is empty

  const duration = Math.random() * (ANIMATION_CONFIG.MAX_DURATION - ANIMATION_CONFIG.MIN_DURATION) + ANIMATION_CONFIG.MIN_DURATION;
  const size = Math.random() * (ANIMATION_CONFIG.MAX_SIZE - ANIMATION_CONFIG.MIN_SIZE) + ANIMATION_CONFIG.MIN_SIZE;

  item.style.width = `${size}px`;
  item.style.height = 'auto';
  item.style.left = `${Math.random() * 100}vw`;
  item.style.setProperty('--duration', `${duration}s`);
  item.style.display = 'block';
  
  // Start the fade-out 1 second before the fall animation ends
  setTimeout(() => {
    item.style.opacity = '0';
  }, (duration * 1000) - 1000);
}

/**
 * Starts the falling animation with the specified interval
 * @param {number} interval - The interval in milliseconds between each animation
 * @returns {number} The interval ID that can be used to stop the animation
 */
export function startFallingAnimation(interval = 400) {
  return setInterval(createFallingAnimation, interval);
}

/**
 * Stops the falling animation
 * @param {number} intervalId - The interval ID returned by startFallingAnimation
 */
export function stopFallingAnimation(intervalId) {
  clearInterval(intervalId);
}