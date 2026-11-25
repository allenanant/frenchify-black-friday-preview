"""Build the scoped stylesheet for the Next.js Black Friday page.

Takes the approved static page's <style> block plus motion-2.css, and scopes
every selector under `.bfp` so nothing leaks to other routes when the visitor
navigates away client-side. :root / html / body map onto `.bfp` itself.

Usage: python scope_css.py <option-2/index.html> <motion-2.css> <out.css>
"""
import re
import sys

html_path, motion_path, out_path = sys.argv[1:4]
page = open(html_path, encoding="utf-8").read()
m = re.search(r"<style>(.*?)</style>", page, re.S)
css = m.group(1) + "\n" + open(motion_path, encoding="utf-8").read()
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def match_brace(s, i):
    """s[i] == '{'. Return index of the matching '}'."""
    depth = 0
    q = None
    while i < len(s):
        c = s[i]
        if q:
            if c == q:
                q = None
        elif c in "\"'":
            q = c
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise SystemExit("unbalanced braces")


def split_top(sel):
    out, depth, cur = [], 0, ""
    for c in sel:
        if c in "([":
            depth += 1
        elif c in ")]":
            depth -= 1
        if c == "," and depth == 0:
            out.append(cur)
            cur = ""
        else:
            cur += c
    out.append(cur)
    return [x.strip() for x in out if x.strip()]


def scope_one(sel):
    for root in (":root", "html", "body"):
        if sel == root:
            return ".bfp"
        if sel.startswith(root) and not sel[len(root)].isalnum() and sel[len(root)] not in "-_":
            rest = sel[len(root):]
            return ".bfp" + rest if rest[0] in ":[." else ".bfp " + rest.strip()
    return ".bfp " + sel


def walk(s):
    out = []
    i = 0
    while i < len(s):
        j = s.find("{", i)
        if j == -1:
            break
        prelude = s[i:j].strip()
        k = match_brace(s, j)
        body = s[j + 1:k]
        if prelude.startswith("@media") or prelude.startswith("@supports"):
            out.append(prelude + "{" + walk(body) + "}")
        elif prelude.startswith("@"):
            out.append(prelude + "{" + body.strip() + "}")
        else:
            sels = ",".join(scope_one(x) for x in split_top(prelude))
            out.append(sels + "{" + body.strip() + "}")
        i = k + 1
    return "\n".join(out)


scoped = walk(css)

# Fonts come from next/font, assets from /public/black-friday/.
scoped = scoped.replace('--sora:"Sora",system-ui,sans-serif', "--sora:var(--bfp-sora),system-ui,sans-serif")
scoped = scoped.replace('--inter:"Inter",system-ui,sans-serif', "--inter:var(--font-inter),system-ui,sans-serif")
scoped = scoped.replace("url(../assets/grain.svg)", "url(/black-friday/grain.svg)")
assert "var(--bfp-sora)" in scoped and "var(--font-inter)" in scoped and "/black-friday/grain.svg" in scoped

header = """/*
 * Black Friday 2026 webinar page, design "Option 2 (Gold Ticket)", approved by
 * Vyom on 25 Nov 2026. GENERATED from the approved static preview
 * (allenanant/frenchify-black-friday-preview: option-2/index.html + assets/motion-2.css)
 * by scope_css.py: every selector is scoped under .bfp so nothing leaks to
 * other routes. Edit the preview and regenerate, or edit here with care.
 *
 * Motion rules: the base styles are the still design; entrances are `from`
 * keyframes with fill both; scroll reveals are CSS scroll-driven animations
 * (compositor only, no JS); browsers without scroll timelines and
 * prefers-reduced-motion users get the still page.
 */
"""
extra = """
/* ---------- Next.js only ---------- */
/* The page is dark: keep iOS overscroll and the area under the page dark too. */
html:has(.bfp){background:#0B0906}
/* Video shells once playing (BfVideos.tsx). */
.bfp .vid .bfp-player{position:absolute;inset:0}
.bfp .playlist iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
/* Visually hidden, still read by screen readers. */
.bfp .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
"""
open(out_path, "w", encoding="utf-8", newline="\n").write(header + scoped + "\n" + extra)
print("wrote", out_path, len(scoped), "chars")
