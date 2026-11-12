// Kinstory — full cover spread: back cover, spine and front cover on one
// page, with bleed on every edge, as print-on-demand services expect.
//
//   typst compile --root <work> --font-path fonts --input data=/cover.json cover.typ cover.pdf

#import "theme.typ": themes, caps

#let data = json(sys.inputs.at("data", default: "/cover.json"))
#let th = themes.at(data.theme, default: themes.heirloom)
#let cloth = rgb(data.cloth)
#let ink = rgb(data.ink)

#let w = data.width * 1in
#let h = data.height * 1in
#let b = data.bleed * 1in
#let spine = data.spine * 1in
#let total-w = 2 * w + spine + 2 * b
#let total-h = h + 2 * b

#set document(title: data.title + " — cover", author: data.author)
#set page(width: total-w, height: total-h, margin: 0pt, fill: cloth)
#set text(font: (th.body, "Libertinus Serif"), fill: ink, lang: data.lang, number-type: "lining")
#set par(justify: false)

// A faint woven texture so the flat colour reads as cloth.
#let weave = tiling(size: (2.4pt, 2.4pt))[
  #place(line(start: (0pt, 0pt), end: (2.4pt, 0pt), stroke: 0.25pt + ink.transparentize(94%)))
  #place(line(start: (0pt, 0pt), end: (0pt, 2.4pt), stroke: 0.25pt + black.transparentize(93%)))
]
#place(rect(width: 100%, height: 100%, fill: weave))

// Front cover ----------------------------------------------------------------
#let front-x = b + w + spine
#place(top + left, dx: front-x, dy: b, box(width: w, height: h)[
  // Blind-stamped border.
  #place(center + horizon, rect(width: w - 0.62in, height: h - 0.62in, stroke: 0.6pt + ink.transparentize(55%)))
  #place(center + horizon, rect(width: w - 0.74in, height: h - 0.74in, stroke: 0.3pt + ink.transparentize(70%)))
  #pad(x: 0.75in, top: h * if data.photo == none { 0.24 } else { 0.13 }, bottom: 0.7in)[
    #align(center)[
      #par(leading: 0.22em, text(font: th.display, weight: th.display-weight, size: w * 0.096, hyphenate: false, data.title))
      #if data.subtitle != none {
        v(w * 0.025)
        par(leading: 0.45em, text(style: "italic", size: w * 0.026, fill: ink.transparentize(12%), hyphenate: false, data.subtitle))
      }
      #v(w * 0.03)
      #text(size: w * 0.04, th.ornament)
    ]
    #if data.photo != none {
      v(1fr)
      let pw = w * 0.5
      let ph = pw / data.photo.aspect
      let maxh = h * 0.34
      let (iw, ih) = if ph > maxh { (maxh * data.photo.aspect, maxh) } else { (pw, ph) }
      align(center, box(fill: rgb("#f3ecdc"), inset: 0.07in, stroke: 0.4pt + black.transparentize(80%), image(data.photo.src, width: iw, height: ih)))
    }
    #v(1fr)
    #align(center, text(size: w * 0.03, caps(th, data.author, tracking: 0.18em)))
  ]
])

// Spine ----------------------------------------------------------------------
#if data.spine >= 0.3 {
  place(top + left, dx: b + w, dy: b, box(width: spine, height: h, align(center + horizon, rotate(90deg, reflow: true, box(width: h - 1in, {
    set text(size: calc.min(spine * 0.42, 13pt))
    grid(
      columns: (1fr, auto, 1fr),
      align: (left + horizon, center + horizon, right + horizon),
      text(font: th.display, weight: th.display-weight, size: 1.2em, data.title),
      text(size: 0.9em, th.ornament),
      caps(th, data.author, tracking: 0.14em),
    )
  })))))
}

// Back cover -----------------------------------------------------------------
#place(top + left, dx: b, dy: b, box(width: w, height: h)[
  #place(center + horizon, rect(width: w - 0.62in, height: h - 0.62in, stroke: 0.6pt + ink.transparentize(55%)))
  #place(center + horizon, rect(width: w - 0.74in, height: h - 0.74in, stroke: 0.3pt + ink.transparentize(70%)))
  #pad(x: 0.9in, top: h * 0.26, bottom: 0.7in)[
    #if data.blurb != none {
      align(center, par(leading: 0.62em, text(font: th.display, style: "italic", size: w * 0.05, weight: if th.display-weight < 400 { 400 } else { th.display-weight }, data.blurb)))
      v(w * 0.03)
      align(center, text(size: w * 0.024, caps(th, data.author, tracking: 0.16em)))
    }
    #v(1fr)
    // Left half of the bottom edge: the right half is kept clear for the
    // barcode most printers add.
    #box(width: 48%, par(leading: 0.4em, text(size: 6.5pt, fill: ink.transparentize(30%), data.madeWith)))
  ]
])
