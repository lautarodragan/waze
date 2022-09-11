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
  let selectedMeasurementIndex = 0

  const render = () => {
    if (!isDirty) {
      requestAnimationFrame(render)
      return
    }

    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(10, 10, canvas.width, canvas.height)
    canvasContext.scale(devicePixelRatio, devicePixelRatio)
    canvasContext.translate(200, 200)

    const [ trafficMeasurement ] = trafficMeasurements

    for (let i = 0; i < trafficMeasurement.measurements.length; i++) {
      renderSingleMeasurement(trafficMeasurement.measurements[i], i === selectedMeasurementIndex)
    }

    isDirty = false
    requestAnimationFrame(render)
  }

  const renderSingleMeasurement = (measurement, isBlue) => {
    const [ maxTransitTime ] = maxTransitTimes

    const startAvenueIndex = measurement.startAvenue.charCodeAt(0) - 65
    const endAvenueIndex = measurement.endAvenue.charCodeAt(0) - 65
    const startStreetIndex = parseInt(measurement.startStreet)
    const endStreetIndex = parseInt(measurement.endStreet)

    const red = Math.floor(measurement.transitTime / maxTransitTime * 256)

    canvasContext.beginPath()
    canvasContext.strokeStyle = !isBlue ? `rgb(${red}, 0, 0)` : 'blue'
    canvasContext.lineWidth = !isBlue ? 1 : 2
    canvasContext.moveTo(startStreetIndex * blockSize, startAvenueIndex * blockSize)
    canvasContext.lineTo(endStreetIndex * blockSize, endAvenueIndex * blockSize)
    canvasContext.stroke()
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

  document.addEventListener('keydown', event => {
    // console.log('keydown', event)
    if (event.key === 'ArrowDown')
      selectedMeasurementIndex--
    else if (event.key === 'ArrowUp')
      selectedMeasurementIndex++
    // console.log('selectedMeasurementIndex', selectedMeasurementIndex)
    isDirty = true
  })
})

const loadTransitSamples = () => fetch('/sample-data.json').then(_ => _.json())

const max = (acc, curr) => curr.transitTime > acc ? curr.transitTime : acc
const min = (acc, curr) => curr.transitTime < acc ? curr.transitTime : acc
