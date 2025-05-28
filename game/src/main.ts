import './style.css'
import { Game } from './game/Game.ts'

// Hide loading screen after a short delay
const hideLoading = () => {
  const loadingElement = document.getElementById('loading')
  if (loadingElement) {
    loadingElement.classList.add('hidden')
    setTimeout(() => {
      loadingElement.style.display = 'none'
    }, 300)
  }
}

// Initialize and start the game
async function main() {
  try {
    const game = new Game()
    await game.init()
    game.start()
    
    // Hide loading screen once game is ready
    hideLoading()
  } catch (error) {
    console.error('Failed to initialize game:', error)
    // Show error message in loading screen
    const loadingElement = document.getElementById('loading')
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2>Error</h2>
          <p>Failed to initialize game</p>
          <p style="font-size: 14px; color: #999;">${error}</p>
        </div>
      `
    }
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}