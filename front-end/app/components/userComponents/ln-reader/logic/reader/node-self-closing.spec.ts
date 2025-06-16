import { expect } from "vitest"

// Test case for a self-closing node
test("Self-closing node", () => {
  const node = document.createElement("img")
  expect(nodeIsSelfClosing(node)).toBe(true)
})

// Test case for a non-self-closing node
test("Non-self-closing node", () => {
  const node = document.createElement("div")
  expect(nodeIsSelfClosing(node)).toBe(false)
})
