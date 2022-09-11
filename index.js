document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementsByTagName('canvas')[0]
  const canvasContext = canvas.getContext('2d')
  const { trafficMeasurements } = await loadTransitSamples()

  // console.log('transitSamples', trafficMeasurements)

  const blockSize = 30

  const render = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    // canvasContext.scale(blockSize, blockSize)

    const [ trafficMeasurement ] = trafficMeasurements

    console.log('trafficMeasurement', trafficMeasurement)

    canvasContext.beginPath()

    for (const measurement of trafficMeasurement.measurements) {
      const startAvenueIndex = measurement.startAvenue.charCodeAt(0) - 65
      const endAvenueIndex = measurement.endAvenue.charCodeAt(0) - 65
      const startStreetIndex = parseInt(measurement.startStreet)
      const endStreetIndex = parseInt(measurement.endStreet)

      canvasContext.moveTo(startAvenueIndex * blockSize, startStreetIndex * blockSize)
      canvasContext.lineTo(endAvenueIndex * blockSize, endStreetIndex * blockSize)
    }

    canvasContext.stroke()
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

const loadTransitSamples = () => fetch('/sample-data.json').then(_ => _.json())
