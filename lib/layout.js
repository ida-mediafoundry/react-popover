/* Axes system. This allows us to at-will work in a different orientation
 without having to manually keep track of knowing if we should be using
 x or y positions. */

let axes = {
  row: {},
  column: {}
}

axes.row.main = {
  start: 'x',
  end: 'x2',
  size: 'w'
}
axes.row.cross = {
  start: 'y',
  end: 'y2',
  size: 'h'
}
axes.column.main = axes.row.cross
axes.column.cross = axes.row.main



let types = [
  { name: 'side', values: ['start', 'end'] },
  { name: 'standing', values: ['above', 'right', 'below', 'left'] },
  { name: 'flow', values: ['column', 'row'] }
]




let fitWithinChecker = (dimension) => {
  return (domainSize, itemSize) => domainSize[dimension] > itemSize[dimension]
}

let doesWidthFitWithin = fitWithinChecker('w')

let doesHeightFitWithin = fitWithinChecker('h')

let doesFitWithin = (domainSize, itemSize) => {
  return doesWidthFitWithin(domainSize, itemSize)
      && doesHeightFitWithin(domainSize, itemSize)
}



let equalCoords = (c1, c2) => {
  for (var key in c1) if (c1[key] !== c2[key]) return false
  return true
}



/* Algorithm for picking the best fitting zone for popover. The current technique will
loop through all zones picking the last one that fits. If none fit the last one is selected.
TODO: In the case that none fit we should pick the least-not-fitting zone. */

let pickZone = (opts, frameBounds, targetBounds, size) => {
  let t = targetBounds, f = frameBounds
  let pick

  let zones = [
    { side: 'start', standing: 'above', flow: 'column', order: -1, w: f.x2, h: t.y },
    { side: 'end', standing: 'right', flow: 'row', order: 1, w: (f.x2 - t.x2), h: f.y2 },
    { side: 'end', standing: 'below', flow: 'column', order: 1, w: f.x2, h: (f.y2 - t.y2) },
    { side: 'start', standing: 'left', flow: 'row', order: -1, w: t.x, h: f.y2 }
  ]

  let availZones = zones.filter((zone) => {
    return doesFitWithin(zone, size)
  })

  /* If the preferred side is part of the available zones, use that otherwise
  pick the largest available zone. If there are no available zones, pick the
  largest zone. TODO: logic that executes picking based on largest option. */

  if (opts.prefer) {
    let preferenceType = getPreferenceType(opts.prefer)
    let preferredAvailZones = availZones.filter((zone) => {
      return zone[preferenceType] === opts.prefer
    })
    if (preferredAvailZones.length) pick = preferredAvailZones[0]
  }

  if (!pick) {
    pick = availZones.length ? availZones[0] : zones[0]
  }

  return pick
}



let getPreferenceType = (preference) => {
  return types.reduce((found, type) => {
    if (found) return found
    return ~type.values.indexOf(preference) ? type.name : null
  }, null)
}




let calcRelPos = (zone, masterBounds, slaveSize) => {
  let { main, cross } = axes[zone.flow]
  /* TODO: The slave is hard-coded to align cross-center with master. */
  let crossAlign = 'center'
  let mainStart = place(zone.flow, 'main', zone.side, masterBounds, slaveSize)
  let mainSize = slaveSize[main.size]
  let crossStart = place(zone.flow, 'cross', crossAlign, masterBounds, slaveSize)
  let crossSize = slaveSize[cross.size]

  return {
    [main.start]: mainStart,
    mainLength: mainSize,
    [main.end]: mainStart + mainSize,
    [cross.start]: crossStart,
    crossLength: crossSize,
    [cross.end]: crossStart + crossSize
  }
}



let place = (flow, axis, align, bounds, size) => {
  let axisProps = axes[flow][axis]
  return (
    align === 'center'
      ? centerOfBounds(flow, axis, bounds) - centerOfSize(flow, axis, size)
    : align === 'end'
      ? bounds[axisProps.end]
    : align === 'start'
      /* DOM rendering unfolds leftward. Therefore if the slave is positioned before
      the master then the slave's position must in addition be pulled back
      by its [the slave's] own length. */
      ? bounds[axisProps.start] - size[axisProps.size]
    : null
  )
}



let centerOfBounds = (flow, axis, bounds) => {
  let props = axes[flow][axis]
  return bounds[props.start] + (bounds[props.size] / 2)
}

let centerOfBoundsFromBounds = (flow, axis, boundsTo, boundsFrom) => {
  return centerOfBounds(flow, axis, boundsTo) - boundsFrom[axes[flow][axis].start]
}



let centerOfSize = (flow, axis, size) => {
  return size[axes[flow][axis].size] / 2
}




/* Element-based layout functions */

let El = {}

El.calcBounds = (el) => {

  if (el === window) {
    return {
      x: 0,
      y: 0,
      x2: el.innerWidth,
      y2: el.innerHeight,
      w: el.innerWidth,
      h: el.innerHeight
    }
  }

  let b = el.getBoundingClientRect()

  return {
    x: b.left,
    y: b.top,
    x2: b.right,
    y2: b.bottom,
    w: b.right - b.left,
    h: b.bottom - b.top
  }
}

El.calcSize = (el) => (
  el === window
    ? { w: el.innerWidth, h: el.innerHeight }
    : { w: el.offsetWidth, h: el.offsetHeight }
)

El.calcScrollSize = (el) => (
  el === window
    ? { w: el.scrollX, h: el.scrollY }
    : { w: el.scrollLeft, h: el.scrollTop }
)



export {
  types,
  calcRelPos,
  place,
  pickZone,
  axes,
  centerOfSize,
  centerOfBounds,
  centerOfBoundsFromBounds,
  doesFitWithin,
  equalCoords,
  El
}
