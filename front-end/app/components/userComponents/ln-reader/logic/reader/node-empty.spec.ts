import { expect } from "vitest"

// Test case for a self-closing node
test("Self-closing node", () => {
  const node = document.createElement("img")
  expect(nodeIsEmpty(node)).toBe(false)
})

// Test case for an empty node
test("Empty node", () => {
  const node = document.createElement("div")
  expect(nodeIsEmpty(node)).toBe(true)
})

// Test case for a node with non-empty text child
test("Non-empty text child", () => {
  const node = document.createElement("div")
  node.appendChild(document.createTextNode("Some text"))
  expect(nodeIsEmpty(node)).toBe(false)
})

// Test case for a node with empty text child
test("Empty text child", () => {
  const node = document.createElement("div")
  node.appendChild(document.createTextNode(""))
  expect(nodeIsEmpty(node)).toBe(true)
})

// Test case for a node with non-text child
test("Non-text child", () => {
  const node = document.createElement("div")
  node.appendChild(document.createElement("span"))
  expect(nodeIsEmpty(node)).toBe(false)
})
