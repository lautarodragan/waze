document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementsByTagName('canvas')[0]
  const canvasContext = canvas.getContext('2d')
  const { trafficMeasurements } = await loadTransitSamples()

  console.log('transitSamples', trafficMeasurements)

  const minTransitTimes = trafficMeasurements.map(_ => _.measurements.reduce(min('transitTime'), 0))
  const maxTransitTimes = trafficMeasurements.map(_ => _.measurements.reduce(max('transitTime'), 0))
  const lowestStreets = trafficMeasurements.map(_ => _.measurements.reduce(min('startStreet'), 0))
  const highestStreets = trafficMeasurements.map(_ => _.measurements.reduce(max('startStreet'), 0))
  const lowestAvenues = trafficMeasurements.map(_ => _.measurements.reduce(min('startAvenue'), 0))
  const highestAvenues = trafficMeasurements.map(_ => _.measurements.reduce(max('startAvenue'), 0))

  console.log('min transit times', minTransitTimes)
  console.log('max transit times', maxTransitTimes)
  console.log('lowestStreets', lowestStreets)
  console.log('highestStreets', highestStreets)
  console.log('lowestAvenues', lowestAvenues)
  console.log('highestAvenues', highestAvenues)

  const blockSize = 30
  let isDirty = true
  let selectedMeasurementIndex = 0
  let translateX
  let translateY

  const render = () => {
    if (!isDirty) {
      requestAnimationFrame(render)
      return
    }

    if (translateX === undefined || translateY === undefined) {
      translateX = canvas.width / 2 / devicePixelRatio - 10 * blockSize
      translateY = canvas.height / 2 / devicePixelRatio - 15 * blockSize
    }

    canvasContext.resetTransform()
    canvasContext.clearRect(0, 0, canvas.width, canvas.height)
    canvasContext.scale(devicePixelRatio, devicePixelRatio)

    const [ trafficMeasurement ] = trafficMeasurements

    const selectedMeasurement = trafficMeasurement.measurements[selectedMeasurementIndex]

    canvasContext.font = '20px serif';
    canvasContext.fillText(`id: ${selectedMeasurementIndex}`, 10, 30)
    if (selectedMeasurement) {
      canvasContext.fillText(`avenues: ${selectedMeasurement.startAvenue} -> ${selectedMeasurement.endAvenue}`, 10, 60)
      canvasContext.fillText(`streets: ${selectedMeasurement.startStreet} -> ${selectedMeasurement.endStreet}`, 10, 90)
      canvasContext.fillText(`transit: ${selectedMeasurement.transitTime}`, 10, 120)
    }

    canvasContext.translate(translateX, translateY)


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
    const startStreetIndex = parseInt(measurement.startStreet) - 1
    const endStreetIndex = parseInt(measurement.endStreet) - 1

    const red = Math.floor(measurement.transitTime / maxTransitTime * 256)

    canvasContext.beginPath()
    canvasContext.strokeStyle = !isBlue ? `rgb(${red}, 0, 0)` : 'blue'
    canvasContext.lineWidth = !isBlue ? 1 : 3
    canvasContext.moveTo(startAvenueIndex * blockSize, startStreetIndex * blockSize)
    canvasContext.lineTo(endAvenueIndex * blockSize, endStreetIndex * blockSize)
    canvasContext.stroke()
  }

  const setCanvasSize = () => {
    canvas.width = window.innerWidth * devicePixelRatio
    canvas.height = window.innerHeight * devicePixelRatio
    isDirty = true
    translateX = undefined
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

    if (selectedMeasurementIndex < 0)
      selectedMeasurementIndex = trafficMeasurements[0].measurements.length - 1
    else if (selectedMeasurementIndex >= trafficMeasurements[0].measurements.length)
      selectedMeasurementIndex = 0

    isDirty = true
  })
})

const loadTransitSamples = () => fetch('/sample-data.json').then(_ => _.json())

const max = (propName) => (acc, curr) => curr[propName] > acc ? curr[propName] : acc
const min = (propName) => (acc, curr) => curr[propName] < acc ? curr[propName] : acc
