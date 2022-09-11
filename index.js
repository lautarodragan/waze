document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementsByTagName('canvas')[0]
  const canvasContext = canvas.getContext('2d')
  const { trafficMeasurements } = await loadTransitSamples()

  console.log('transitSamples', trafficMeasurements)

  const minTransitTimes = trafficMeasurements.map(_ => _.measurements.reduce(min, 0))
  const maxTransitTimes = trafficMeasurements.map(_ => _.measurements.reduce(max, 0))

  console.log('min transit times', minTransitTimes)
  console.log('max transit times', maxTransitTimes)

  const blockSize = 30
  let isDirty = true

  const render = () => {
    if (!isDirty) {
      requestAnimationFrame(render)
      return
    }

    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    canvasContext.scale(devicePixelRatio, devicePixelRatio)
    canvasContext.translate(200, 200)

    const [ trafficMeasurement ] = trafficMeasurements
    const [ maxTransitTime ] = maxTransitTimes

    console.log('trafficMeasurement', trafficMeasurement)
    console.log('maxTransitTime', maxTransitTime)

    for (const measurement of trafficMeasurement.measurements.slice(1)) {
      const startAvenueIndex = measurement.startAvenue.charCodeAt(0) - 65
      const endAvenueIndex = measurement.endAvenue.charCodeAt(0) - 65
      const startStreetIndex = parseInt(measurement.startStreet)
      const endStreetIndex = parseInt(measurement.endStreet)

      const red = Math.floor(measurement.transitTime / maxTransitTime * 256)
      // console.log('red', red)

      canvasContext.beginPath()
      canvasContext.strokeStyle = `rgb(${red}, 0, 0)`
      canvasContext.moveTo(startStreetIndex * blockSize, startAvenueIndex * blockSize)
      canvasContext.lineTo(endStreetIndex * blockSize, endAvenueIndex * blockSize)
      canvasContext.stroke()
    }

    isDirty = false
    requestAnimationFrame(render)
  }

  const setCanvasSize = () => {
    canvas.width = window.innerWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    isDirty = true
  }

  setCanvasSize()

  requestAnimationFrame(render)

  window.addEventListener('resize', () => {
    setCanvasSize()
  })
})

const loadTransitSamples = () => fetch('/sample-data.json').then(_ => _.json())

const max = (acc, curr) => curr.transitTime > acc ? curr.transitTime : acc
const min = (acc, curr) => curr.transitTime < acc ? curr.transitTime : acc
