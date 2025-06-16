import { listen } from "@fcanvas/communicate"

import { paginateHtml } from "../paginate"

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type PaginateWorkerListen = {
  "paginate html": (
    style: string,
    height: number,
    html: string
  ) => Promise<string[]>
}

addEventListener("message", (event) => {
  if (event.data instanceof MessagePort) {
    const port2 = event.data
    port2.start()

    listen<PaginateWorkerListen, "paginate html">(
      port2,
      "paginate html",
      async (styles, height, html) => {
        return (await paginateHtml(styles, height, html)).map(
          (page) => page.innerHTML
        )
      }
    )
  }
})
