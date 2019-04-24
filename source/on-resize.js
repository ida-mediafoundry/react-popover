/* eslint no-param-reassign: 0 */

import { ResizeSensor } from "css-element-queries"

import { isServer, window } from "./platform"

const namespace = "__resizeDetector__"

const uninitialize = el => {
  el[namespace].sensor.detach()
  el[namespace] = undefined
}

const initialize = el => {
  const detector = (el[namespace] = {})
  detector.listeners = []

  if (isServer) {
    return
  }

  // Register onResize that loops through the listeners
  detector.sensor = new ResizeSensor(el, () =>
    detector.listeners.forEach(listener => listener()),
  )
}

const on = (el, fn) => {
  /* Window object natively publishes resize events. We handle it as a
  special case here so that users do not have to think about two APIs. */

  if (el === window) {
    window.addEventListener("resize", fn)
    return
  }

  /* Not caching namespace read here beacuse not guaranteed that its available. */

  if (!el[namespace]) initialize(el)
  el[namespace].listeners.push(fn)
}

const off = (el, fn) => {
  if (el === window) {
    window.removeEventListener("resize", fn)
    return
  }
  const detector = el[namespace]
  if (!detector) return
  const i = detector.listeners.indexOf(fn)
  if (i !== -1) detector.listeners.splice(i, 1)
  if (!detector.listeners.length) uninitialize(el)
}

export default {
  on,
  off,
  addEventListener: on,
  removeEventListener: off,
}
export { on, off, on as addEventListener, off as removeEventListener }
