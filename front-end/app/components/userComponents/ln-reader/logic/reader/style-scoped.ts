function isScopeSupported() {
  const style = document.createElement("style")
  style.textContent = "@scope {}"
  document.head.appendChild(style)

  const isSupported = style.sheet?.cssRules.length !== 0
  document.head.removeChild(style)
  return isSupported
}

let scopeSupported: boolean | undefined
export function styleScoped(css: string, id: string) {
  scopeSupported ??= isScopeSupported()

  const style = document.createElement("style")

  if (scopeSupported) {
    style.textContent = `@scope(#${id}){${css}}`
    return style
  }

  const rules = css.match(/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g)
  let scoped = ""
  if (rules)
    for (let i = 0; i < rules.length; i++)
      scoped += id + " " + rules[i].split(",").join("," + id)

  style.textContent = scoped
  return style
}
