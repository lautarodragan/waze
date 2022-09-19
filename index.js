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
  let highlightedMeasurementIndex = null
  let highlightedCorner = null
  let selectedCornerA = null
  let selectedCornerB = null
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
    canvasContext.fillStyle = 'black'
    canvasContext.fillText(`id: ${selectedMeasurementIndex}`, 10, 30)
    if (selectedMeasurement) {
      canvasContext.fillText(`avenues: ${selectedMeasurement.startAvenue} -> ${selectedMeasurement.endAvenue}`, 10, 60)
      canvasContext.fillText(`streets: ${selectedMeasurement.startStreet} -> ${selectedMeasurement.endStreet}`, 10, 90)
      canvasContext.fillText(`transit: ${selectedMeasurement.transitTime}`, 10, 120)
      canvasContext.fillText(`corner A: ${selectedCornerA?.startAvenue} Avenue, ${selectedCornerA?.startStreet} Street`, 10, 150)
      canvasContext.fillText(`corner B: ${selectedCornerB?.startAvenue} Avenue, ${selectedCornerB?.startStreet} Street`, 10, 180)
      if (highlightedCorner)
        canvasContext.fillText(`corner on mouse: ${highlightedCorner.startAvenue} Avenue, ${highlightedCorner.startStreet} Street`, 10, 210)
    }

    canvasContext.translate(translateX, translateY)


    for (let i = 0; i < trafficMeasurement.measurements.length; i++) {
      const color = i === selectedMeasurementIndex ? 'blue' : i === highlightedMeasurementIndex ? 'orange' : null
      renderSingleMeasurement(trafficMeasurement.measurements[i], color)
    }

    if (highlightedCorner)
      renderCorner(highlightedCorner, 'orange')

    if (selectedCornerA)
      renderCorner(selectedCornerA, 'red')

    if (selectedCornerB)
      renderCorner(selectedCornerB, 'green')

    isDirty = false
    requestAnimationFrame(render)
  }

  const renderCorner = (measurement, color = 'orange') => {
    const x = (measurement.startAvenue.charCodeAt(0) - 65) * blockSize // - blockSize / 2
    const y = (parseInt(measurement.startStreet) - 1) * blockSize // - blockSize / 2
    canvasContext.fillStyle = color
    canvasContext.beginPath();
    canvasContext.arc(x, y, blockSize / 4, 0, 2 * Math.PI);
    canvasContext.fill();
  }

  const renderSingleMeasurement = (measurement, color) => {
    const [ maxTransitTime ] = maxTransitTimes

    const startAvenueIndex = measurement.startAvenue.charCodeAt(0) - 65
    const endAvenueIndex = measurement.endAvenue.charCodeAt(0) - 65
    const startStreetIndex = parseInt(measurement.startStreet) - 1
    const endStreetIndex = parseInt(measurement.endStreet) - 1

    const red = Math.floor(measurement.transitTime / maxTransitTime * 256)

    canvasContext.beginPath()
    canvasContext.strokeStyle = !color ? `rgb(${red}, 0, 0, .5)` : color
    canvasContext.lineWidth = !color ? 2 : 3
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

  const findRoute = () => {
    if (!selectedCornerA || !selectedCornerB) {
      console.log('Select Corner A and B first.')
      return
    }

    const intersectionA = {
      avenue: selectedCornerA.startAvenue,
      street: selectedCornerA.startStreet,
    }

    const intersectionB = {
      avenue: selectedCornerB.startAvenue,
      street: selectedCornerB.startStreet,
    }

    console.log(`Finding route from (${intersectionA.avenue}, ${intersectionA.street}) to (${intersectionB.avenue}, ${intersectionB.street})`)

    let calls = 0
    let foundPaths = 0
    let bestTransit = Number.POSITIVE_INFINITY
    let discardedRoutes = 0

    const recursiveOuter = () => {
      const recursiveInner = (intersection, intersections = [], totalTransit = 0) => {
        calls++

        if (calls % 10_000 === 0)
          debugger

        if (calls > 100_000)
          throw new Error('Nope. This is not working.')

        // optimization: discard this path completely if we haven't reached the goal and it's already worse than another found path
        if (totalTransit >= bestTransit) {
          discardedRoutes++
          return
        }

        const equalsIntersection = intersectionsEq(intersection)

        // are you winning, son?
        if (equalsIntersection(intersectionB)) {
          bestTransit = totalTransit
          foundPaths++
          return [...intersections, intersection]
        }

        // infinite loop avoidance: no sense in going over the same intersection twice
        if (intersections.some(equalsIntersection))
          return

        // find all possible next steps
        const segments = trafficMeasurements[0].measurements.filter(measurement => {
          return measurement.startAvenue === intersection.avenue && measurement.startStreet === intersection.street
        })

        // optimization: travel linearly closest paths first
        const sortedSegments = [...segments].sort((a, b) =>
          linearDistanceBetweenIntersections({ avenue: a.endAvenue, street: a.endStreet }, intersectionB) - linearDistanceBetweenIntersections({ avenue: b.endAvenue, street: b.endStreet }, intersectionB)
        )

        // travel on...
        const paths = sortedSegments.map(segment =>
          recursiveInner({ avenue: segment.endAvenue, street: segment.endStreet }, [...intersections, intersection], totalTransit + segment.transitTime)
        )

        // by now we found up to 4 routes from A to B.
        // latter entries in the array will be better than earlier due to bestTransit optimization,
        // so we navigate it backwards and return the first successful path
        for (let i = paths.length - 1; i--; i >= 0)
          if (paths[i])
            return paths[i]

      }

      return recursiveInner(intersectionA)
    }

    const bestPath = recursiveOuter()

    console.log('%cPath Finder Result', 'font-weight: bold')
    console.log(`steps traveled: ${calls}`)
    console.log(`valid routes found: ${foundPaths}`)
    console.log(`discardedRoutes: ${discardedRoutes}`)
    console.log(`transit: ${bestTransit}`)
    console.log(bestPath)

  }

  const intersectionsEq = a => b => a.street === b.street && a.avenue === b.avenue

  const linearDistanceBetweenIntersections = (a, b) => {
    const startAvenueIndex = a.avenue.charCodeAt(0) - 65
    const startStreetIndex = parseInt(a.street) - 1
    const endAvenueIndex = b.avenue.charCodeAt(0) - 65
    const endStreetIndex = parseInt(b.street) - 1

    return Math.sqrt((endAvenueIndex - startAvenueIndex) ** 2 + (endStreetIndex - startStreetIndex) ** 2)
  }

  setCanvasSize()

  requestAnimationFrame(render)

  window.addEventListener('resize', () => {
    setCanvasSize()
  })

  document.addEventListener('keydown', event => {
    // console.log('keydown', event)

    if (event.key === 'Enter') {
      findRoute()
      return
    }

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

  canvas.addEventListener('mousemove', event => {
    const padding = 8
    const { clientX, clientY } = event
    const translatedX = clientX - translateX
    const translatedY = clientY - translateY

    const trafficMeasurementIndex = trafficMeasurements[0].measurements.findIndex(measurement => {
      const startAvenueIndex = measurement.startAvenue.charCodeAt(0) - 65
      const endAvenueIndex = measurement.endAvenue.charCodeAt(0) - 65
      const startStreetIndex = parseInt(measurement.startStreet) - 1
      const endStreetIndex = parseInt(measurement.endStreet) - 1
      const x1 = startAvenueIndex * blockSize
      const y1 = startStreetIndex * blockSize
      const x2 = endAvenueIndex * blockSize
      const y2 = endStreetIndex * blockSize

      return (translatedX >= x1 - padding && translatedX <= x2 + padding && translatedY >= y1 - padding && translatedY <= y2 + padding)
    })

    const corner = trafficMeasurements[0].measurements.find(measurement => {
      const startAvenueIndex = measurement.startAvenue.charCodeAt(0) - 65
      const startStreetIndex = parseInt(measurement.startStreet) - 1
      const x = startAvenueIndex * blockSize
      const y = startStreetIndex * blockSize

      return (translatedX >= x - blockSize / 2 && translatedX <= x + blockSize / 2 && translatedY >= y - blockSize / 2 && translatedY <= y + blockSize / 2)
    })

    // highlightedMeasurementIndex = trafficMeasurementIndex
    if (corner !== highlightedCorner) {
      highlightedCorner = corner
      isDirty = true
    }
  })

  canvas.addEventListener('click', event => {
    selectedCornerA = highlightedCorner
    isDirty = true
  })

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault()
    selectedCornerB = highlightedCorner
    isDirty = true
  })
})

const loadTransitSamples = () => fetch('/sample-data.json').then(_ => _.json())

const max = (propName) => (acc, curr) => curr[propName] > acc ? curr[propName] : acc
const min = (propName) => (acc, curr) => curr[propName] < acc ? curr[propName] : acc
