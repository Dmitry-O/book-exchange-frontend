export const DEMO_BOOK_PRESETS = [
  {
    id: "mondarchiv-am-hafen",
    label: "Das Mondarchiv am Hafen",
    name: "Das Mondarchiv am Hafen",
    author: "Mara Steinbach",
    category: "Fantasy",
    publicationYear: "2022",
    city: "Berlin",
    contactDetails: "Demo-Abholung: Berlin Mitte, werktags ab 18:00 Uhr.",
    description:
      "Ein atmosphärischer Roman über ein geheimes Archiv, wandernde Erinnerungen und eine Buchhändlerin, die nachts verschwundene Geschichten zurückholt.",
    isGift: false,
    coverPath: "/demo-book-presets/mondarchiv-am-hafen.jpg"
  },
  {
    id: "maschinenwinter",
    label: "Maschinenwinter",
    name: "Maschinenwinter",
    author: "Jonas Falkenried",
    category: "Science Fiction",
    publicationYear: "2024",
    city: "Hamburg",
    contactDetails: "Demo-Übergabe: Hamburg Altona oder Versand nach Absprache.",
    description:
      "Eine schnelle Science-Fiction-Geschichte über eine vereiste Küstenstadt, autonome Maschinen und die Frage, wem Technologie eigentlich dienen soll.",
    isGift: false,
    coverPath: "/demo-book-presets/maschinenwinter.jpg"
  },
  {
    id: "kleine-rituale-grosse-tage",
    label: "Kleine Rituale, große Tage",
    name: "Kleine Rituale, große Tage",
    author: "Lea Morgenstern",
    category: "Self-help",
    publicationYear: "2023",
    city: "München",
    contactDetails: "Demo-Kontakt: erst kurz schreiben, dann Übergabe am Hauptbahnhof vereinbaren.",
    description:
      "Ein freundlicher Ratgeber über kleine Alltagsroutinen, realistische Ziele und Gewohnheiten, die auch in vollen Wochen funktionieren.",
    isGift: false,
    coverPath: "/demo-book-presets/kleine-rituale-grosse-tage.jpg"
  },
  {
    id: "briefe-aus-lindenau",
    label: "Briefe aus Lindenau",
    name: "Briefe aus Lindenau",
    author: "Clara Weiden",
    category: "Classic",
    publicationYear: "1998",
    city: "Köln",
    contactDetails: "Demo-Geschenk: Köln Innenstadt, am Wochenende flexibel.",
    description:
      "Ein ruhiger Familienroman über alte Briefe, ein geerbtes Haus und zwei Geschwister, die nach Jahren wieder miteinander sprechen müssen.",
    isGift: true,
    coverPath: "/demo-book-presets/briefe-aus-lindenau.jpg"
  },
  {
    id: "der-letzte-compiler",
    label: "Der letzte Compiler",
    name: "Der letzte Compiler",
    author: "Niko Brandt",
    category: "Technology",
    publicationYear: "2021",
    city: "Düsseldorf",
    contactDetails: "Demo-Übergabe: Düsseldorf MedienHafen nach Feierabend.",
    description:
      "Ein leicht zugänglicher Tech-Thriller über Legacy-Systeme, verschwundene Backups und ein Entwicklerteam kurz vor dem großen Release.",
    isGift: false,
    coverPath: "/demo-book-presets/der-letzte-compiler.jpg"
  }
];

export function buildDemoBookPresetOptions(locale) {
  const placeholder =
    locale === "ru"
      ? "Заполнить демо-книгой"
      : locale === "de"
        ? "Demo-Buch einfügen"
        : "Fill with a demo book";

  return [
    { label: placeholder, value: "" },
    ...DEMO_BOOK_PRESETS.map((preset) => ({
      label: preset.label,
      value: preset.id
    }))
  ];
}

export function findDemoBookPreset(presetId) {
  return DEMO_BOOK_PRESETS.find((preset) => preset.id === presetId) ?? null;
}
