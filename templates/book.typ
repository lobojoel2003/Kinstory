// Kinstory — book interior.
//
// Compiled by Kinstory with:
//   typst compile --root <work> --font-path fonts --input data=/book.json book.typ out.pdf
//
// The JSON contract is produced by src/lib/server/book/book-data.ts. Keep the
// two in step: every field read here is written there.

#import "theme.typ": themes, ink-color, caps, ordinal-word, ornament-font

#let data = json(sys.inputs.at("data", default: "/book.json"))
#let meta = data.meta
#let fmt = data.format
#let labels = data.labels
#let th = themes.at(fmt.theme, default: themes.heirloom)
#let accent = if fmt.color { th.accent } else { black }
#let ink = if fmt.color { ink-color } else { black }
#let soft = if fmt.color { ink-color.lighten(30%) } else { luma(70) }

// ---------------------------------------------------------------------------
// Page geometry
// ---------------------------------------------------------------------------

#let trim-w = fmt.width * 1in
#let trim-h = fmt.height * 1in
#let bleed = if fmt.bleedMode == "none" { 0in } else { fmt.bleed * 1in }

// Larger trims get slightly larger type and a capped measure so that lines
// stay near 65 characters, the length readers find most comfortable.
#let body-size = th.size * if fmt.width >= 7.5 { 1.1 } else if fmt.width >= 6.9 { 1.05 } else { 1 }
#let base-inside = 0.55in + 0.05in * fmt.width
#let base-outside = 0.35in + 0.045in * fmt.width
#let available = trim-w - base-inside - base-outside
#let max-measure = 31 * body-size
#let extra = if available > max-measure { available - max-measure } else { 0pt }
#let m-inside = base-inside + extra * 0.52
#let m-outside = base-outside + extra * 0.48
#let m-top = 0.45in + 0.03in * fmt.height
#let m-bottom = m-top + 0.14in

// Bleed is added on the trimmed edges only: every edge for printers such as
// Lulu, the outside edge plus top and bottom for KDP and IngramSpark.
#let margins = if fmt.bleedMode == "all" {
  (inside: m-inside + bleed, outside: m-outside + bleed, top: m-top + bleed, bottom: m-bottom + bleed)
} else if fmt.bleedMode == "outside" {
  (inside: m-inside, outside: m-outside + bleed, top: m-top + bleed, bottom: m-bottom + bleed)
} else {
  (inside: m-inside, outside: m-outside, top: m-top, bottom: m-bottom)
}
#let page-w = trim-w + if fmt.bleedMode == "all" { 2 * bleed } else if fmt.bleedMode == "outside" { bleed } else { 0in }
#let page-h = trim-h + if fmt.bleedMode == "none" { 0in } else { 2 * bleed }
#let text-h = trim-h - m-top - m-bottom

// ---------------------------------------------------------------------------
// Running heads and folios
// ---------------------------------------------------------------------------

// "front" pages carry no running heads or folios; "body" and "back" do.
#let chrome = state("chrome", "front")

#let on-page(lbl, p) = query(lbl).any(m => m.location().page() == p)

// A page is blank when the most recent flow marker before it closed a
// section on an earlier page, which is how `pagebreak(to: "odd")` pages look.
#let is-blank(p) = {
  let ms = query(selector(<flow-start>).or(<flow-end>)).filter(m => m.location().page() <= p)
  if ms.len() == 0 { return false }
  let last = ms.last()
  last.label == <flow-end> and last.location().page() < p
}

#let quiet(p) = (
  chrome.get() == "front" or is-blank(p) or on-page(<chapter-start>, p) or on-page(<no-chrome>, p)
)

#let running-head = context {
  let p = here().page()
  if quiet(p) { return }
  set text(size: 0.78em, fill: soft)
  if calc.even(p) {
    align(center, caps(th, meta.title, tracking: 0.12em))
  } else {
    let hs = query(heading.where(level: 2).before(here()))
    let current = if hs.len() > 0 { hs.last().body } else { meta.title }
    align(center, caps(th, current, tracking: 0.12em))
  }
}

#let folio = context {
  let p = here().page()
  if chrome.get() == "front" or is-blank(p) or on-page(<no-chrome>, p) { return }
  align(center, text(size: 0.86em, fill: soft, counter(page).display("1")))
}

// ---------------------------------------------------------------------------
// Document setup
// ---------------------------------------------------------------------------

#set document(title: meta.title, author: meta.author, keywords: ("memoir", "family stories", "Kinstory"))
#set page(
  width: page-w,
  height: page-h,
  margin: margins,
  header: running-head,
  footer: folio,
  header-ascent: 38%,
  footer-descent: 34%,
)
#set text(
  font: (th.body, "Libertinus Serif"),
  size: body-size,
  lang: data.lang,
  hyphenate: true,
  fill: ink,
  number-type: "old-style",
  costs: (widow: 100%, orphan: 100%),
)
#set par(
  justify: true,
  leading: th.leading,
  spacing: th.leading,
  first-line-indent: (amount: 1.3em, all: false),
  linebreaks: "optimized",
)
// Balanced line breaks for display lines: a title that needs two lines gets
// two lines of similar length instead of a long line and a lonely word.
#let balanced(body, max-width: 100%) = layout(size => context {
  let limit = if type(max-width) == ratio { size.width * max-width } else { max-width }
  let full = measure(body).width
  if full <= limit {
    body
  } else {
    // Narrowest width that still needs no more lines than the full measure.
    let h-min = measure(block(width: limit, body)).height
    let target = full / calc.ceil(full / limit)
    let tries = 0
    while tries < 16 and target < limit and measure(block(width: target, body)).height > h-min + 0.5pt {
      target = target * 1.04
      tries += 1
    }
    block(width: calc.min(target, limit), body)
  }
})

#show heading: set text(hyphenate: false)
#show heading.where(level: 1): it => {
  set par(justify: false, leading: 0.3em, first-line-indent: 0pt)
  set text(font: th.display, weight: th.display-weight, size: 2.6em, fill: ink)
  block(width: 100%, align(center, balanced(max-width: 88%, it.body)))
}
#show heading.where(level: 2): it => {
  set par(justify: false, leading: 0.32em, first-line-indent: 0pt)
  set text(font: th.display, weight: th.display-weight, size: th.title-size, fill: ink, number-type: "lining")
  block(width: 100%, align(center, balanced(max-width: 92%, it.body)))
}

// ---------------------------------------------------------------------------
// Typographic pieces
// ---------------------------------------------------------------------------

#let ornament(size: 1em) = align(center, text(font: ornament-font, size: if th.ornament == "◆" { size * 0.6 } else { size }, fill: accent, th.ornament))

// Closes a story's last paragraph, so the ending can never be stranded alone
// at the top of a page.
#let endmark = [#h(0.45em)#box(text(font: ornament-font, size: if th.endmark == "■" { 0.55em } else { 0.95em }, fill: accent, th.endmark))]

#let listen-code(src) = block(width: 100%, align(center, grid(
  columns: (0.56in, 1.9in),
  column-gutter: 0.13in,
  align: horizon + left,
  image(src, width: 0.56in),
  text(size: 0.72em, fill: soft, par(justify: false, leading: 0.4em, first-line-indent: 0pt, labels.listen)),
)))

#let quote-marks = ("\"", "“", "‘", "'", "«", "„", "(")

// A three-line drop cap set in the display face, followed by a small-caps
// lead-in. The words beside the cap are measured so that exactly `lines`
// lines sit next to it, the last of them fully justified.
#let drop-cap(body-text, lines: 3, tail: none) = context {
  let words = body-text.split(" ").filter(w => w != "")
  let first = body-text.clusters().first()
  if words.len() < 18 or first in quote-marks {
    // Too short to carry a drop cap: open with small capitals only.
    let n = calc.min(3, words.len())
    par[#caps(th, words.slice(0, n).join(" ")) #words.slice(n).join(" ")#tail]
    return
  }

  let line-cap = measure(text(top-edge: "cap-height", bottom-edge: "baseline", "H")).height
  let gap = measure(par(leading: th.leading, [H \ H])).height - 2 * line-cap
  let cap-span = lines * line-cap + (lines - 1) * gap
  let probe = measure(text(font: th.display, size: 100pt, top-edge: "cap-height", bottom-edge: "baseline", "H")).height
  let cap-size = 100pt * (cap-span / probe)
  let cap = text(
    font: th.display,
    size: cap-size,
    weight: if th.display-weight < 400 { 400 } else { th.display-weight },
    fill: accent,
    top-edge: "cap-height",
    bottom-edge: "baseline",
    number-type: "lining",
    first,
  )
  let cap-w = measure(cap).width + 0.32em
  let column = page.width - margins.inside - margins.outside - cap-w

  // The opening words after the initial: rest of the first word plus two more.
  let head = words.first().clusters().slice(1).join()
  let lead-n = calc.min(3, words.len())
  let lead = (head, ..words.slice(1, lead-n)).join(" ")
  let rest = words.slice(lead-n)

  let segment(k) = [#caps(th, lead) #rest.slice(0, k).join(" ")]
  let fits(k) = measure(block(width: column, par(justify: true, first-line-indent: 0pt, segment(k)))).height <= cap-span + 0.5pt

  let lo = 0
  let hi = rest.len()
  while lo < hi {
    let mid = calc.div-euclid(lo + hi + 1, 2)
    if fits(mid) { lo = mid } else { hi = mid - 1 }
  }

  block(spacing: th.leading, grid(
    columns: (cap-w, 1fr),
    box(height: cap-span, cap),
    par(justify: true, first-line-indent: 0pt)[#segment(lo)#if lo < rest.len() { linebreak(justify: true) } else { tail }],
  ))
  if lo < rest.len() {
    par(first-line-indent: 0pt)[#rest.slice(lo).join(" ")#tail]
  }
}

#let pull-quote(q) = block(width: 100%, above: 1.5em, below: 1.5em, breakable: false, inset: (x: 6%))[
  #set par(justify: false, leading: 0.45em)
  #ornament(size: 0.8em)
  #v(0.15em)
  #align(center, balanced(text(font: th.display, style: "italic", hyphenate: false, size: 1.42em, fill: accent, weight: if th.display-weight < 400 { 400 } else { th.display-weight }, [“#q”])))
  #v(0.1em)
]

#let caption(c) = if c != none and c != "" {
  v(0.45em)
  align(center, par(justify: false, leading: 0.45em, text(size: 0.82em, style: "italic", fill: soft, hyphenate: false, c)))
}

#let max-photo-h = text-h * 0.6

#let photo-size(aspect, width) = {
  // Returns the width that keeps the photo inside the height cap.
  let h = width / aspect
  if h > max-photo-h { max-photo-h * aspect } else { width }
}

#let photo-block(photos) = context {
  let w = page.width - margins.inside - margins.outside
  let first = photos.first()
  let body = if photos.len() >= 2 {
    let a = photos.at(0)
    let b = photos.at(1)
    let g = 0.18in
    let wa = (w - g) * a.aspect / (a.aspect + b.aspect)
    let wb = (w - g) * b.aspect / (a.aspect + b.aspect)
    let hh = wa / a.aspect
    let scale = if hh > max-photo-h { max-photo-h / hh } else { 1 }
    grid(
      columns: (wa * scale, wb * scale),
      column-gutter: g,
      align: center + bottom,
      image(a.src, width: 100%),
      image(b.src, width: 100%),
    )
    let caps-text = (a.caption, b.caption).filter(c => c != none and c != "")
    caption(caps-text.join(" · "))
  } else {
    let target = if first.layout == "inset" { w * 0.64 } else { w }
    let iw = photo-size(first.aspect, target)
    align(center, image(first.src, width: iw))
    caption(first.caption)
  }
  block(width: 100%, breakable: false, above: 1.3em, below: 1.3em, align(center, body))
}

// A full-page plate is a float the height of the text block, so the story
// keeps flowing on the current page and the plate takes the next one whole.
#let plate(p) = place(top, float: true, clearance: 0pt, block(width: 100%, height: text-h, breakable: false, {
  [#metadata("plate") <no-chrome>]
  context {
    let w = page.width - margins.inside - margins.outside
    let h = text-h * 0.86
    let iw = if w / p.aspect > h { h * p.aspect } else { w }
    v(1fr)
    align(center, image(p.src, width: iw))
    caption(p.caption)
    v(1.2fr)
  }
}))

// Photos float to the top of the page, except on a chapter opening, where
// they sink to the bottom so they never sit above the chapter title.
#let place-photos(group) = {
  if group.first().layout == "plate" {
    for p in group { plate(p) }
  } else {
    context {
      let opening = on-page(<chapter-start>, here().page())
      place(if opening { bottom } else { top }, float: true, clearance: 1.4em, photo-block(group))
    }
  }
}

// Consecutive "pair" photos are set side by side.
#let group-photos(photos) = {
  let groups = ()
  let i = 0
  while i < photos.len() {
    let p = photos.at(i)
    if p.layout == "pair" and i + 1 < photos.len() and photos.at(i + 1).layout == "pair" {
      groups.push((p, photos.at(i + 1)))
      i += 2
    } else {
      groups.push((p,))
      i += 1
    }
  }
  groups
}

#let photos-after(s, idx) = s.photos.filter(p => p.after == idx)

// ---------------------------------------------------------------------------
// Story
// ---------------------------------------------------------------------------

#let story(s, n) = {
  if fmt.chapterOpensRecto { pagebreak(to: "odd", weak: true) } else { pagebreak(weak: true) }
  [#metadata(n) <chapter-start>]
  [#metadata(n) <flow-start>]
  [#metadata((question: s.question, by: s.askedBy, title: s.title)) <question>]
  v(text-h * 0.13)
  if fmt.chapterNumbers {
    align(center, text(fill: accent, size: 0.92em, caps(th, labels.chapter + " " + ordinal-word(n), tracking: 0.16em)))
    v(0.7em)
  }
  heading(level: 2, s.title)
  v(0.85em)
  ornament(size: 0.9em)
  if s.question != none and s.question != "" {
    v(0.7em)
    align(center, block(width: 82%, par(justify: false, leading: 0.5em, text(style: "italic", size: 0.96em, fill: soft, hyphenate: false, s.question))))
    if s.askedBy != none and s.askedBy != "" {
      v(0.3em)
      align(center, text(size: 0.8em, fill: soft, caps(th, labels.askedBy + " " + s.askedBy, tracking: 0.1em)))
    }
  }
  if s.recorded != none and s.recorded != "" {
    v(0.25em)
    align(center, text(size: 0.76em, style: "italic", fill: soft, s.recorded))
  }
  v(2.1em)

  // The listen code sits at the foot of the opening page.
  if s.qr != none { place(bottom, float: true, clearance: 1.6em, listen-code(s.qr)) }
  for g in group-photos(photos-after(s, 0)) { place-photos(g) }

  let last = s.paragraphs.len() - 1
  for (i, para) in s.paragraphs.enumerate() {
    let tail = if i == last { endmark } else { none }
    if i == 0 and fmt.dropCaps { drop-cap(para, tail: tail) } else if i == 0 {
      let words = para.split(" ")
      let k = calc.min(3, words.len())
      par[#caps(th, words.slice(0, k).join(" ")) #words.slice(k).join(" ")#tail]
    } else if i == 1 {
      par(first-line-indent: (amount: 1.3em, all: true))[#para#tail]
    } else { par[#para#tail] }
    if s.pullQuote != none and s.pullQuoteAfter == i + 1 { pull-quote(s.pullQuote) }
    for g in group-photos(photos-after(s, i + 1)) { place-photos(g) }
  }
  for g in group-photos(s.photos.filter(p => p.after == none or p.after > s.paragraphs.len())) {
    place-photos(g)
  }
  [#metadata(n) <flow-end>]
}

// ---------------------------------------------------------------------------
// Front matter
// ---------------------------------------------------------------------------

#let section-page(body) = {
  [#metadata("front") <flow-start>]
  body
  [#metadata("front") <flow-end>]
}

// Half title
#section-page({
  v(text-h * 0.26)
  align(center, text(font: th.display, weight: th.display-weight, size: 1.7em, tracking: 0.02em, meta.title))
})
#pagebreak()

// Frontispiece (verso) or blank
#if data.frontispiece != none {
  section-page({
    let f = data.frontispiece
    context {
      let w = page.width - margins.inside - margins.outside
      let h = text-h * 0.8
      let iw = if w / f.aspect > h { h * f.aspect } else { w }
      v(1fr)
      align(center, image(f.src, width: iw))
      caption(f.caption)
      v(1fr)
    }
  })
}
#pagebreak(to: "odd")

// Title page
#section-page({
  v(text-h * 0.16)
  align(center)[
    #par(justify: false, leading: 0.25em, text(font: th.display, weight: th.display-weight, size: 3em, number-type: "lining", hyphenate: false, meta.title))
    #if meta.subtitle != none and meta.subtitle != "" {
      v(0.8em)
      block(width: 86%, par(justify: false, leading: 0.5em, text(style: "italic", size: 1.12em, fill: soft, hyphenate: false, meta.subtitle)))
    }
    #v(1.6em)
    #ornament(size: 1.25em)
  ]
  v(1fr)
  align(center, text(size: 1.05em, caps(th, meta.author, tracking: 0.14em)))
  if meta.imprint != none and meta.imprint != "" {
    v(0.7em)
    align(center, text(size: 0.84em, style: "italic", fill: soft, meta.imprint))
  }
  v(text-h * 0.04)
})
#pagebreak()

// Copyright and colophon (verso)
#section-page({
  v(1fr)
  set par(justify: false, leading: 0.5em, spacing: 0.9em, first-line-indent: 0pt)
  set text(size: 0.74em, fill: soft)
  par(text(style: "italic", meta.title))
  for line in meta.colophon { par(line) }
})

// Dedication (recto)
#if meta.dedication != none and meta.dedication != "" {
  pagebreak(to: "odd")
  section-page({
    v(text-h * 0.28)
    align(center, block(width: 74%, par(justify: false, leading: 0.6em, text(style: "italic", size: 1.08em, hyphenate: false, meta.dedication))))
  })
}

// Contents (recto)
#pagebreak(to: "odd")
#section-page({
  v(text-h * 0.1)
  align(center, text(font: th.display, weight: th.display-weight, size: 1.9em, labels.contents))
  v(0.6em)
  ornament(size: 0.9em)
  v(1.8em)
  set par(justify: false, first-line-indent: 0pt, spacing: 0.62em)
  context {
    let hs = query(heading.where(outlined: true))
    for h in hs {
      let num = counter(page).at(h.location()).first()
      if h.level == 1 {
        v(0.8em)
        align(center, text(size: 0.84em, fill: accent, caps(th, h.body, tracking: 0.14em)))
        v(0.3em)
      } else {
        grid(
          columns: (1fr, auto),
          column-gutter: 1em,
          link(h.location(), h.body),
          text(fill: soft, link(h.location(), str(num))),
        )
      }
    }
    if fmt.questionsIndex {
      v(0.8em)
      let q = query(<questions-start>)
      if q.len() > 0 {
        grid(
          columns: (1fr, auto),
          column-gutter: 1em,
          text(style: "italic", labels.questions),
          text(fill: soft, str(counter(page).at(q.first().location()).first())),
        )
      }
    }
  }
})

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

#pagebreak(to: "odd")
#chrome.update("body")
#counter(page).update(1)

#let n = 0
#for (pi, part) in data.parts.enumerate() {
  if part.title != none and part.title != "" {
    pagebreak(to: "odd", weak: true)
    [#metadata("part") <no-chrome>]
    [#metadata("part") <flow-start>]
    v(text-h * 0.3)
    align(center, text(fill: accent, size: 0.92em, caps(th, labels.part + " " + ordinal-word(pi + 1), tracking: 0.16em)))
    v(0.9em)
    heading(level: 1, part.title)
    v(0.9em)
    ornament()
    [#metadata("part") <flow-end>]
  }
  for s in part.stories {
    n += 1
    story(s, n)
  }
}

// ---------------------------------------------------------------------------
// Back matter
// ---------------------------------------------------------------------------

#chrome.update("back")

#if fmt.questionsIndex {
  pagebreak(to: "odd", weak: true)
  [#metadata("questions") <questions-start>]
  [#metadata("questions") <chapter-start>]
  [#metadata("questions") <flow-start>]
  v(text-h * 0.1)
  align(center, text(font: th.display, weight: th.display-weight, size: 1.9em, labels.questions))
  v(0.6em)
  ornament(size: 0.9em)
  v(0.9em)
  align(center, block(width: 84%, par(justify: false, text(style: "italic", size: 0.9em, fill: soft, hyphenate: false, labels.questionsIntro))))
  v(1.4em)
  set par(justify: false, first-line-indent: 0pt, spacing: 1.05em, leading: 0.5em)
  context {
    for q in query(<question>) {
      let v = q.value
      if v.question != none and v.question != "" {
        let num = counter(page).at(q.location()).first()
        block(breakable: false, grid(
          columns: (1fr, auto),
          column-gutter: 1.2em,
          [#v.question #if v.by != none and v.by != "" { text(size: 0.8em, fill: soft, [ — #caps(th, v.by)]) }],
          text(fill: soft, link(q.location(), str(num))),
        ))
      }
    }
  }
  [#metadata("questions") <flow-end>]
}

#if meta.afterword.len() > 0 {
  pagebreak(to: "odd", weak: true)
  [#metadata("afterword") <chapter-start>]
  [#metadata("afterword") <flow-start>]
  v(text-h * 0.1)
  align(center, text(font: th.display, weight: th.display-weight, size: 1.9em, labels.afterword))
  v(0.6em)
  ornament(size: 0.9em)
  v(1.8em)
  for p in meta.afterword { par(p) }
  [#metadata("afterword") <flow-end>]
}

// A note on the type
#pagebreak(weak: true)
#metadata("type") <no-chrome>
#metadata("type") <flow-start>
#v(1fr)
#align(center, block(width: 78%)[
  #ornament()
  #v(0.8em)
  #set par(justify: false, leading: 0.55em, first-line-indent: 0pt)
  #text(size: 0.86em, caps(th, labels.typeNote, tracking: 0.14em))
  #v(0.5em)
  #text(size: 0.86em, style: "italic", fill: soft, data.typeNote)
])
#v(1.3fr)
#metadata("type") <flow-end>
