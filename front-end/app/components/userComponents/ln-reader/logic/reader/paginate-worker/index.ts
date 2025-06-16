import { put } from "@fcanvas/communicate"

import type { PaginateWorkerListen } from "./iframe-script"
import iframeScript from "./iframe-script.ts?braw"
import iframeHtml from "./iframe.html?raw"

const iframeSrcDoc = iframeHtml.replace("//@SCRIPT", iframeScript)

function initPagWorker(): Promise<PaginateWorkerListen["paginate html"]> {
  return new Promise((resolve, reject) => {
    const iframe =
      document.querySelector<HTMLIFrameElement>("#iframe_worker") ??
      document.createElement("iframe")

    if (!iframe.id) {
      iframe.setAttribute("id", "iframe_worker")
      iframe.srcdoc = iframeSrcDoc
      Object.assign(iframe.style, {
        position: "fixed",
        left: "-9999px",
        overflow: "hidden",
        visible: "hidden",
        width: "0px",
        height: "0px"
      })
    }

    const { port1, port2 } = new MessageChannel()
    port1.start()

    iframe.onload = () => {
      console.log("[iframe]: loaded")
      iframe.contentWindow?.postMessage(port2, "*", [port2])

      resolve((styles, height, html) => {
        return put<PaginateWorkerListen>(
          port1,
          "paginate html",
          styles,
          height,
          html
        )
      })
      iframe.onload = iframe.onerror = null
    }
    iframe.onerror = reject

    document.body.appendChild(iframe)
  })
}

let runPagWorker: Awaited<ReturnType<typeof initPagWorker>> | null = null
export async function paginateWorker(wrap: HTMLElement, html: string) {
  runPagWorker ??= await initPagWorker()

  return runPagWorker(
    styleChanges(wrap),
    parseFloat(getComputedStyle(wrap).height),
    html
  )
}
