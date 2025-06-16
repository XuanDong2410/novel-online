export function nodeIsText(node: Node): node is Text {
  return node.nodeType === Node.TEXT_NODE
}
