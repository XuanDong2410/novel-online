const selfNodes = new Set([
  "area",
  "base",
  "br",
  "col",
  "command",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
])

export function nodeIsSelfClosing(node: Node): boolean {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false
  }

  return selfNodes.has(node.nodeName.toLowerCase())
}
