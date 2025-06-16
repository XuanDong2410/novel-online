import { nodeIsEmpty } from "./node-empty"
import { nodeIsText } from "./node-is-text"
import { styleScoped } from "./style-scoped"

// const childNodes= Array.from(virtualWrap.childNodes)

// autoWrapText(childNodes, wrap)

const EMPTY_ARRAY: never[] = [] // import.meta.env.DEV ? Object.freeze([]) : []

const excludeSplitNodes = new Set(["svg", "video", "audio", "figure"])
const hiddenNodes = new Set(["style", "script", "link", "meta", "title"])

const wrapRootNotEmptyStore = new WeakSet<Record<string, never>>()

if (!customElements.get("span-quark")) {
  // eslint-disable-next-line functional/no-classes
  class HTMLSpanQuarkElement extends HTMLSpanElement {
    constructor() {
      super()
      this.attachShadow({ mode: "closed" })
    }
  }

  customElements.define("span-quark", HTMLSpanQuarkElement, { extends: "span" })
}

const storeSpanNodeQuark = new WeakSet<HTMLSpanElement>()
function splitTextNode(node: Text) {
  return (
    node.nodeValue?.split(/\s|\n/).map((word) => {
      if (!word) return null

      const span = document.createElement("span-quark")
      span.textContent = word + " "
      storeSpanNodeQuark.add(span)
      return span
    }) ?? EMPTY_ARRAY
  )
}
function getReduceHeight(node: HTMLElement, adject: number) {
  const rect = node.getBoundingClientRect()
  return rect.height + rect.top + adject
}

type AnalyticNode =
  | Node
  | {
      parent: Node
      nodes: AnalyticNode[]
    }
function analytics(
  wrapRoot: Record<string, never>,
  parentNode: Node,
  height: number,
  adject: number
): AnalyticNode[] {
  const nodes = []
  let currentHeight: number = 0

  const { childNodes } = parentNode
  for (let i = 0; i < childNodes.length; i++) {
    let node = childNodes[i] as Text | HTMLElement

    // skip case node is hidden
    if (hiddenNodes.has(node.nodeName.toLowerCase())) {
      nodes.push(node)
      continue
    }

    // break case node is image
    if (node.nodeName.toUpperCase() === "IMG") {
      if (!wrapRootNotEmptyStore.has(wrapRoot)) {
        ;(node as HTMLImageElement).style.maxHeight = "100%"
        ;(node as HTMLImageElement).style.maxWidth = "100%"
        nodes.push(node)
        wrapRootNotEmptyStore.add(wrapRoot)
        // don't remove because node moved to new wrap
        // node.parentNode?.removeChild(node)
      } else {
        console.warn("Break trace because node is image")
      }
      break
    }

    // replace node is span element. if node > height call analytics
    if (nodeIsText(node)) {
      if (!node.nodeValue?.trim()) continue

      const next = node?.nextSibling
      const parent = node.parentNode!
      const span = document.createElement("span-quark")
      span.appendChild(node)
      if (next) parent.insertBefore(span, next)
      else parent.appendChild(span)
      const $node = node
      node = span

      const reduceCurrentHeight = getReduceHeight(span, adject)
      if (reduceCurrentHeight > height) {
        // cannot apply all text
        node.replaceWith(...(splitTextNode($node).filter(Boolean) as Node[]))

        if (nodes.length > 0) wrapRootNotEmptyStore.add(wrapRoot)

        const $nodes = analytics(wrapRoot, parent, height, adject)
        if ($nodes.length > 0) {
          nodes.push(...$nodes)
          wrapRootNotEmptyStore.add(wrapRoot)
        }
        // only text
        break
      }
    }

    // check position if not outside -> add() and continue
    const reduceCurrentHeight = getReduceHeight(node, adject)
    const hasImg = (node as HTMLElement).querySelector?.("img")
    if (!hasImg && reduceCurrentHeight <= height) {
      // allow oke
      currentHeight = reduceCurrentHeight
      nodes.push(node)

      if (node.clientHeight > 0)
        // node empty child because check on before
        wrapRootNotEmptyStore.add(wrapRoot)

      continue
    }

    // ============= break if apply node then outside =============

    const nodeIsPuroto = excludeSplitNodes.has(node.nodeName.toLowerCase())

    // if node is quark break because append to outside
    // TODO: resolve this if font > height
    if (storeSpanNodeQuark.has(node)) break
    // outside break

    // if wrap can add node.
    if (height > currentHeight) {
      // TODO: no need: while
      if (nodeIsEmpty(node) || nodeIsPuroto) {
        // node = node.nextElementSibling

        ;(node as HTMLElement).style.maxHeight = "100%"

        if (!wrapRootNotEmptyStore.has(wrapRoot)) {
          nodes.push(node)
          wrapRootNotEmptyStore.add(wrapRoot)
        }

        break
      }

      // if (node) {
      // try append child nodes
      if (nodes.length > 0) wrapRootNotEmptyStore.add(wrapRoot)

      const $nodes = analytics(wrapRoot, node, height, adject)
      if ($nodes.length > 0) {
        nodes.push({ parent: node, nodes: $nodes })
        wrapRootNotEmptyStore.add(wrapRoot)
      }
      // }
    }
    break
  }

  return nodes
}
function applyPage(wrap: HTMLElement, ns: AnalyticNode[]) {
  ns.forEach((item) => {
    if (!("nodes" in item)) {
      wrap.appendChild(item)
      return
    }

    const { parent, nodes } = item
    const element = parent.cloneNode(false)
    applyPage(element as HTMLElement, nodes)

    if (nodeIsEmpty(parent)) parent.parentNode?.removeChild(parent)

    wrap.appendChild(element)
  })
}

const idPaginater = "htmlのページ付け"
const idStyleForPaginater = "styleのページ付け"
const onTop = 9999
export async function paginateHtml(
  styles: string,
  height: number,
  html: string
) {
  const div =
    document.getElementById(idPaginater) ?? document.createElement("div")
  if (!div.id) {
    div.setAttribute("id", idPaginater)
    document.body.appendChild(div)
  }
  const style =
    document.getElementById(idStyleForPaginater) ??
    document.createElement("style")
  if (!style.id) {
    style.setAttribute("id", idStyleForPaginater)
    document.head.appendChild(style)
  }

  div.innerHTML = html
  style.textContent = `#${idPaginater}{${styles}}`

  Object.assign(div.style, {
    position: "fixed",
    top: `-${onTop}px`,
    height: "auto",
    background: "black"
  })

  const pages: HTMLDivElement[] = []

  console.time("Total analytics")
  while (!nodeIsEmpty(div)) {
    console.time()
    const ns = analytics(Object.create(null), div, height, onTop)

    const parent = document.createElement("div")
    pages.push(parent)

    applyPage(parent, ns)

    parent.querySelectorAll("style")?.forEach((style) => {
      style.replaceWith(styleScoped(style.textContent!, idPaginater))
    })

    console.timeEnd()
  }
  console.timeEnd("Total analytics")

  return pages
}
