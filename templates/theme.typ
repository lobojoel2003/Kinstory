// Kinstory — shared book design system.
//
// Everything that the interior and the cover agree on lives here: type
// families, sizes, colours and small typographic helpers. Data comes from the
// JSON file Kinstory writes next to these templates (see book-data.ts).

#let themes = (
  heirloom: (
    name: "Heirloom",
    body: "EB Garamond",
    display: "Cormorant Garamond",
    label: "EB Garamond",
    size: 11.6pt,
    leading: 0.66em,
    display-weight: 300,
    title-size: 2.35em,
    label-upper: false,
    smallcaps: true,
    ornament: "❦",
    endmark: "❦",
    accent: rgb("#7a2e22"),
  ),
  caslon: (
    name: "Almanac",
    body: "Libre Caslon Text",
    display: "Libre Caslon Display",
    label: "Libre Caslon Text",
    size: 10.4pt,
    leading: 0.78em,
    display-weight: 400,
    title-size: 2.15em,
    label-upper: true,
    smallcaps: false,
    ornament: "❧",
    endmark: "❧",
    accent: rgb("#2f4a3a"),
  ),
  modern: (
    name: "Field Notes",
    body: "Newsreader",
    display: "Newsreader",
    label: "Inter",
    size: 11pt,
    leading: 0.72em,
    display-weight: 300,
    title-size: 2.2em,
    label-upper: true,
    smallcaps: false,
    ornament: "◆",
    endmark: "■",
    accent: rgb("#23324a"),
  ),
)

#let ink-color = rgb("#1c1916")

// Fleurons come from EB Garamond, which every theme bundles, so all themes
// can use them whatever their text face covers.
#let ornament-font = ("EB Garamond", "Cormorant Garamond", "Inter")

// Letter-spaced small capitals. Fonts with real small caps get them; the
// others get tracked capitals at a reduced size, which reads the same way.
#let caps(th, body, tracking: 0.09em) = {
  if th.smallcaps {
    text(tracking: tracking, smallcaps(all: true, body))
  } else if th.label-upper {
    text(font: th.label, size: 0.72em, weight: 500, tracking: tracking + 0.05em, upper(body))
  } else {
    text(size: 0.8em, tracking: tracking + 0.04em, upper(body))
  }
}

#let numbers-in-words = (
  "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen", "Twenty",
)

#let roman(n) = numbering("I", n)

// "One" … "Twenty", then roman numerals for very long books.
#let ordinal-word(n) = if n <= numbers-in-words.len() {
  numbers-in-words.at(n - 1)
} else {
  roman(n)
}
