export function styleChanges(element: HTMLElement) {
  const styles = getComputedStyle(element)

  let changes = ""
  for (let i = 0; i < styles.length; i++) {
    const name = styles.item(i)
    const curr = styles[name]

    changes += `${name}:${curr};`
  }

  return changes
}
