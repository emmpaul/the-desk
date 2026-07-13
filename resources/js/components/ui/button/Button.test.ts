import { describe, expect, it } from "vitest"
import { createSSRApp, h } from "vue"
import { renderToString } from "vue/server-renderer"
import { Button } from "."

/**
 * Renders `<Button>` to an HTML string in the node test environment (no DOM
 * needed). `$t` is stubbed to echo its key so the Spinner's `$t('Loading')`
 * resolves without the full app locale plumbing.
 */
async function renderButton(props: Record<string, unknown>): Promise<string> {
  const app = createSSRApp({
    render: () => h(Button, props, { default: () => "Save changes" }),
  })

  app.config.globalProperties.$t = (key: string) => key

  return renderToString(app)
}

describe("Button loading prop", () => {
  it("renders the spinner and disables the button while loading", async () => {
    const html = await renderButton({ loading: true })

    // The Spinner renders a `role="status"` element (its accessible pending cue).
    expect(html).toContain('role="status"')
    expect(html).toContain("animate-spin")
    // The `disabled` attribute, not the `disabled:` Tailwind utilities.
    expect(html).toMatch(/disabled(?!:)/)
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain("Save changes")
  })

  it("renders no spinner and stays enabled when not loading", async () => {
    const html = await renderButton({ loading: false })

    expect(html).not.toContain('role="status"')
    expect(html).not.toContain("animate-spin")
    expect(html).not.toMatch(/disabled(?!:)/)
    expect(html).not.toContain("aria-busy")
  })
})
