import { nodeIsText } from "./node-is-text"
import { nodeIsSelfClosing } from "./node-self-closing"

export function nodeIsEmpty(node: Node): boolean {
  if (nodeIsSelfClosing(node)) return false
  if (node.childNodes.length === 0) return true

  for (let i = 0; i < node.childNodes.length; i++) {
    const $node = node.childNodes.item(i)
    if (nodeIsText($node)) {
      if ($node.nodeValue && $node.nodeValue.trim()) return false
      continue
    }

    return false

    // if (!nodeIsEmpty($node)) return false
  }

  return true
}
