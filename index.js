
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementsByTagName('canvas')[0]
  const canvasContext = canvas.getContext('2d')

  const render = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    canvasContext.fillRect(50, 50, 500, 500)
  }

  const setCanvasSize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    requestAnimationFrame(render)
  }

  setCanvasSize()

  requestAnimationFrame(render)

  window.addEventListener('resize', () => {
    setCanvasSize()
  })
})

