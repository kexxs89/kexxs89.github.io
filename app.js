const STORAGE_KEY = "wm-2026-tippspiel-state-v1";
const SUBMISSION_KEY = "wm-2026-tippspiel-submission-v1";
const PUBLISHED_STATE_URL = "./tippspiel-state.json";
const IS_ADMIN = new URLSearchParams(window.location.search).get("admin") === "1";
const SUBMISSION_FILE_TYPE = "wm-2026-tippspiel-submission-v1";
const VIEW_HASHES = {
  dashboard: "rangliste",
  submit: "tippabgabe",
  viewer: "tipps-ansehen",
  matrix: "alle-tipps",
  players: "teilnehmer",
  predictions: "tipps",
  results: "ergebnisse",
  rules: "punkte",
};
const VIEW_BY_HASH = Object.fromEntries(Object.entries(VIEW_HASHES).map(([view, hash]) => [hash, view]));

const ROUND32_BRACKET_SLOTS = [
  ["1E", "3E"],
  ["1I", "3I"],
  ["2A", "2B"],
  ["1F", "2C"],
  ["2K", "2L"],
  ["1H", "2J"],
  ["1D", "3D"],
  ["1G", "3G"],
  ["1C", "2F"],
  ["2E", "2I"],
  ["1A", "3A"],
  ["1L", "3L"],
  ["1J", "2H"],
  ["2D", "2G"],
  ["1B", "3B"],
  ["1K", "3K"],
];

const THIRD_PLACE_ASSIGNMENT_COLUMNS = ["A", "B", "D", "E", "G", "I", "K", "L"];

const THIRD_PLACE_ASSIGNMENT_ROWS = [
  "EFGHIJKL:EJIFHGLK", "DFGHIJKL:HGIDJFLK", "DEGHIJKL:EJIDHGLK", "DEFHIJKL:EJIDHFLK", "DEFGIJKL:EGIDJFLK",
  "DEFGHJKL:EGJDHFLK", "DEFGHIKL:EGIDHFLK", "DEFGHIJL:EGJDHFLI", "DEFGHIJK:EGJDHFIK", "CFGHIJKL:HGICJFLK",
  "CEGHIJKL:EJICHGLK", "CEFHIJKL:EJICHFLK", "CEFGIJKL:EGICJFLK", "CEFGHJKL:EGJCHFLK", "CEFGHIKL:EGICHFLK",
  "CEFGHIJL:EGJCHFLI", "CEFGHIJK:EGJCHFIK", "CDGHIJKL:HGICJDLK", "CDFHIJKL:CJIDHFLK", "CDFGIJKL:CGIDJFLK",
  "CDFGHJKL:CGJDHFLK", "CDFGHIKL:CGIDHFLK", "CDFGHIJL:CGJDHFLI", "CDFGHIJK:CGJDHFIK", "CDEHIJKL:EJICHDLK",
  "CDEGIJKL:EGICJDLK", "CDEGHJKL:EGJCHDLK", "CDEGHIKL:EGICHDLK", "CDEGHIJL:EGJCHDLI", "CDEGHIJK:EGJCHDIK",
  "CDEFIJKL:CJEDIFLK", "CDEFHJKL:CJEDHFLK", "CDEFHIKL:CEIDHFLK", "CDEFHIJL:CJEDHFLI", "CDEFHIJK:CJEDHFIK",
  "CDEFGJKL:CGEDJFLK", "CDEFGIKL:CGEDIFLK", "CDEFGIJL:CGEDJFLI", "CDEFGIJK:CGEDJFIK", "CDEFGHKL:CGEDHFLK",
  "CDEFGHJL:CGJDHFLE", "CDEFGHJK:CGJDHFEK", "CDEFGHIL:CGEDHFLI", "CDEFGHIK:CGEDHFIK", "CDEFGHIJ:CGJDHFEI",
  "BFGHIJKL:HJBFIGLK", "BEGHIJKL:EJIBHGLK", "BEFHIJKL:EJBFIHLK", "BEFGIJKL:EJBFIGLK", "BEFGHJKL:EJBFHGLK",
  "BEFGHIKL:EGBFIHLK", "BEFGHIJL:EJBFHGLI", "BEFGHIJK:EJBFHGIK", "BDGHIJKL:HJBDIGLK", "BDFHIJKL:HJBDIFLK",
  "BDFGIJKL:IGBDJFLK", "BDFGHJKL:HGBDJFLK", "BDFGHIKL:HGBDIFLK", "BDFGHIJL:HGBDJFLI", "BDFGHIJK:HGBDJFIK",
  "BDEHIJKL:EJBDIHLK", "BDEGIJKL:EJBDIGLK", "BDEGHJKL:EJBDHGLK", "BDEGHIKL:EGBDIHLK", "BDEGHIJL:EJBDHGLI",
  "BDEGHIJK:EJBDHGIK", "BDEFIJKL:EJBDIFLK", "BDEFHJKL:EJBDHFLK", "BDEFHIKL:EIBDHFLK", "BDEFHIJL:EJBDHFLI",
  "BDEFHIJK:EJBDHFIK", "BDEFGJKL:EGBDJFLK", "BDEFGIKL:EGBDIFLK", "BDEFGIJL:EGBDJFLI", "BDEFGIJK:EGBDJFIK",
  "BDEFGHKL:EGBDHFLK", "BDEFGHJL:HGBDJFLE", "BDEFGHJK:HGBDJFEK", "BDEFGHIL:EGBDHFLI", "BDEFGHIK:EGBDHFIK",
  "BDEFGHIJ:HGBDJFEI", "BCGHIJKL:HJBCIGLK", "BCFHIJKL:HJBCIFLK", "BCFGIJKL:IGBCJFLK", "BCFGHJKL:HGBCJFLK",
  "BCFGHIKL:HGBCIFLK", "BCFGHIJL:HGBCJFLI", "BCFGHIJK:HGBCJFIK", "BCEHIJKL:EJBCIHLK", "BCEGIJKL:EJBCIGLK",
  "BCEGHJKL:EJBCHGLK", "BCEGHIKL:EGBCIHLK", "BCEGHIJL:EJBCHGLI", "BCEGHIJK:EJBCHGIK", "BCEFIJKL:EJBCIFLK",
  "BCEFHJKL:EJBCHFLK", "BCEFHIKL:EIBCHFLK", "BCEFHIJL:EJBCHFLI", "BCEFHIJK:EJBCHFIK", "BCEFGJKL:EGBCJFLK",
  "BCEFGIKL:EGBCIFLK", "BCEFGIJL:EGBCJFLI", "BCEFGIJK:EGBCJFIK", "BCEFGHKL:EGBCHFLK", "BCEFGHJL:HGBCJFLE",
  "BCEFGHJK:HGBCJFEK", "BCEFGHIL:EGBCHFLI", "BCEFGHIK:EGBCHFIK", "BCEFGHIJ:HGBCJFEI", "BCDHIJKL:HJBCIDLK",
  "BCDGIJKL:IGBCJDLK", "BCDGHJKL:HGBCJDLK", "BCDGHIKL:HGBCIDLK", "BCDGHIJL:HGBCJDLI", "BCDGHIJK:HGBCJDIK",
  "BCDFIJKL:CJBDIFLK", "BCDFHJKL:CJBDHFLK", "BCDFHIKL:CIBDHFLK", "BCDFHIJL:CJBDHFLI", "BCDFHIJK:CJBDHFIK",
  "BCDFGJKL:CGBDJFLK", "BCDFGIKL:CGBDIFLK", "BCDFGIJL:CGBDJFLI", "BCDFGIJK:CGBDJFIK", "BCDFGHKL:CGBDHFLK",
  "BCDFGHJL:CGBDHFLJ", "BCDFGHJK:HGBCJFDK", "BCDFGHIL:CGBDHFLI", "BCDFGHIK:CGBDHFIK", "BCDFGHIJ:HGBCJFDI",
  "BCDEIJKL:EJBCIDLK", "BCDEHJKL:EJBCHDLK", "BCDEHIKL:EIBCHDLK", "BCDEHIJL:EJBCHDLI", "BCDEHIJK:EJBCHDIK",
  "BCDEGJKL:EGBCJDLK", "BCDEGIKL:EGBCIDLK", "BCDEGIJL:EGBCJDLI", "BCDEGIJK:EGBCJDIK", "BCDEGHKL:EGBCHDLK",
  "BCDEGHJL:HGBCJDLE", "BCDEGHJK:HGBCJDEK", "BCDEGHIL:EGBCHDLI", "BCDEGHIK:EGBCHDIK", "BCDEGHIJ:HGBCJDEI",
  "BCDEFJKL:CJBDEFLK", "BCDEFIKL:CEBDIFLK", "BCDEFIJL:CJBDEFLI", "BCDEFIJK:CJBDEFIK", "BCDEFHKL:CEBDHFLK",
  "BCDEFHJL:CJBDHFLE", "BCDEFHJK:CJBDHFEK", "BCDEFHIL:CEBDHFLI", "BCDEFHIK:CEBDHFIK", "BCDEFHIJ:CJBDHFEI",
  "BCDEFGKL:CGBDEFLK", "BCDEFGJL:CGBDJFLE", "BCDEFGJK:CGBDJFEK", "BCDEFGIL:CGBDEFLI", "BCDEFGIK:CGBDEFIK",
  "BCDEFGIJ:CGBDJFEI", "BCDEFGHL:CGBDHFLE", "BCDEFGHK:CGBDHFEK", "BCDEFGHJ:HGBCJFDE", "BCDEFGHI:CGBDHFEI",
  "AFGHIJKL:HJIFAGLK", "AEGHIJKL:EJIAHGLK", "AEFHIJKL:EJIFAHLK", "AEFGIJKL:EJIFAGLK", "AEFGHJKL:EGJFAHLK",
  "AEFGHIKL:EGIFAHLK", "AEFGHIJL:EGJFAHLI", "AEFGHIJK:EGJFAHIK", "ADGHIJKL:HJIDAGLK", "ADFHIJKL:HJIDAFLK",
  "ADFGIJKL:IGJDAFLK", "ADFGHJKL:HGJDAFLK", "ADFGHIKL:HGIDAFLK", "ADFGHIJL:HGJDAFLI", "ADFGHIJK:HGJDAFIK",
  "ADEHIJKL:EJIDAHLK", "ADEGIJKL:EJIDAGLK", "ADEGHJKL:EGJDAHLK", "ADEGHIKL:EGIDAHLK", "ADEGHIJL:EGJDAHLI",
  "ADEGHIJK:EGJDAHIK", "ADEFIJKL:EJIDAFLK", "ADEFHJKL:HJEDAFLK", "ADEFHIKL:HEIDAFLK", "ADEFHIJL:HJEDAFLI",
  "ADEFHIJK:HJEDAFIK", "ADEFGJKL:EGJDAFLK", "ADEFGIKL:EGIDAFLK", "ADEFGIJL:EGJDAFLI", "ADEFGIJK:EGJDAFIK",
  "ADEFGHKL:HGEDAFLK", "ADEFGHJL:HGJDAFLE", "ADEFGHJK:HGJDAFEK", "ADEFGHIL:HGEDAFLI", "ADEFGHIK:HGEDAFIK",
  "ADEFGHIJ:HGJDAFEI", "ACGHIJKL:HJICAGLK", "ACFHIJKL:HJICAFLK", "ACFGIJKL:IGJCAFLK", "ACFGHJKL:HGJCAFLK",
  "ACFGHIKL:HGICAFLK", "ACFGHIJL:HGJCAFLI", "ACFGHIJK:HGJCAFIK", "ACEHIJKL:EJICAHLK", "ACEGIJKL:EJICAGLK",
  "ACEGHJKL:EGJCAHLK", "ACEGHIKL:EGICAHLK", "ACEGHIJL:EGJCAHLI", "ACEGHIJK:EGJCAHIK", "ACEFIJKL:EJICAFLK",
  "ACEFHJKL:HJECAFLK", "ACEFHIKL:HEICAFLK", "ACEFHIJL:HJECAFLI", "ACEFHIJK:HJECAFIK", "ACEFGJKL:EGJCAFLK",
  "ACEFGIKL:EGICAFLK", "ACEFGIJL:EGJCAFLI", "ACEFGIJK:EGJCAFIK", "ACEFGHKL:HGECAFLK", "ACEFGHJL:HGJCAFLE",
  "ACEFGHJK:HGJCAFEK", "ACEFGHIL:HGECAFLI", "ACEFGHIK:HGECAFIK", "ACEFGHIJ:HGJCAFEI", "ACDHIJKL:HJICADLK",
  "ACDGIJKL:IGJCADLK", "ACDGHJKL:HGJCADLK", "ACDGHIKL:HGICADLK", "ACDGHIJL:HGJCADLI", "ACDGHIJK:HGJCADIK",
  "ACDFIJKL:CJIDAFLK", "ACDFHJKL:HJFCADLK", "ACDFHIKL:HFICADLK", "ACDFHIJL:HJFCADLI", "ACDFHIJK:HJFCADIK",
  "ACDFGJKL:CGJDAFLK", "ACDFGIKL:CGIDAFLK", "ACDFGIJL:CGJDAFLI", "ACDFGIJK:CGJDAFIK", "ACDFGHKL:HGFCADLK",
  "ACDFGHJL:CGJDAFLH", "ACDFGHJK:HGJCAFDK", "ACDFGHIL:HGFCADLI", "ACDFGHIK:HGFCADIK", "ACDFGHIJ:HGJCAFDI",
  "ACDEIJKL:EJICADLK", "ACDEHJKL:HJECADLK", "ACDEHIKL:HEICADLK", "ACDEHIJL:HJECADLI", "ACDEHIJK:HJECADIK",
  "ACDEGJKL:EGJCADLK", "ACDEGIKL:EGICADLK", "ACDEGIJL:EGJCADLI", "ACDEGIJK:EGJCADIK", "ACDEGHKL:HGECADLK",
  "ACDEGHJL:HGJCADLE", "ACDEGHJK:HGJCADEK", "ACDEGHIL:HGECADLI", "ACDEGHIK:HGECADIK", "ACDEGHIJ:HGJCADEI",
  "ACDEFJKL:CJEDAFLK", "ACDEFIKL:CEIDAFLK", "ACDEFIJL:CJEDAFLI", "ACDEFIJK:CJEDAFIK", "ACDEFHKL:HEFCADLK",
  "ACDEFHJL:HJFCADLE", "ACDEFHJK:HJECAFDK", "ACDEFHIL:HEFCADLI", "ACDEFHIK:HEFCADIK", "ACDEFHIJ:HJECAFDI",
  "ACDEFGKL:CGEDAFLK", "ACDEFGJL:CGJDAFLE", "ACDEFGJK:CGJDAFEK", "ACDEFGIL:CGEDAFLI", "ACDEFGIK:CGEDAFIK",
  "ACDEFGIJ:CGJDAFEI", "ACDEFGHL:HGFCADLE", "ACDEFGHK:HGECAFDK", "ACDEFGHJ:HGJCAFDE", "ACDEFGHI:HGECAFDI",
  "ABGHIJKL:HJBAIGLK", "ABFHIJKL:HJBAIFLK", "ABFGIJKL:IJBFAGLK", "ABFGHJKL:HJBFAGLK", "ABFGHIKL:HGBAIFLK",
  "ABFGHIJL:HJBFAGLI", "ABFGHIJK:HJBFAGIK", "ABEHIJKL:EJBAIHLK", "ABEGIJKL:EJBAIGLK", "ABEGHJKL:EJBAHGLK",
  "ABEGHIKL:EGBAIHLK", "ABEGHIJL:EJBAHGLI", "ABEGHIJK:EJBAHGIK", "ABEFIJKL:EJBAIFLK", "ABEFHJKL:EJBFAHLK",
  "ABEFHIKL:EIBFAHLK", "ABEFHIJL:EJBFAHLI", "ABEFHIJK:EJBFAHIK", "ABEFGJKL:EJBFAGLK", "ABEFGIKL:EGBAIFLK",
  "ABEFGIJL:EJBFAGLI", "ABEFGIJK:EJBFAGIK", "ABEFGHKL:EGBFAHLK", "ABEFGHJL:HJBFAGLE", "ABEFGHJK:HJBFAGEK",
  "ABEFGHIL:EGBFAHLI", "ABEFGHIK:EGBFAHIK", "ABEFGHIJ:HJBFAGEI", "ABDHIJKL:IJBDAHLK", "ABDGIJKL:IJBDAGLK",
  "ABDGHJKL:HJBDAGLK", "ABDGHIKL:IGBDAHLK", "ABDGHIJL:HJBDAGLI", "ABDGHIJK:HJBDAGIK", "ABDFIJKL:IJBDAFLK",
  "ABDFHJKL:HJBDAFLK", "ABDFHIKL:HIBDAFLK", "ABDFHIJL:HJBDAFLI", "ABDFHIJK:HJBDAFIK", "ABDFGJKL:FJBDAGLK",
  "ABDFGIKL:IGBDAFLK", "ABDFGIJL:FJBDAGLI", "ABDFGIJK:FJBDAGIK", "ABDFGHKL:HGBDAFLK", "ABDFGHJL:HGBDAFLJ",
  "ABDFGHJK:HGBDAFJK", "ABDFGHIL:HGBDAFLI", "ABDFGHIK:HGBDAFIK", "ABDFGHIJ:HGBDAFIJ", "ABDEIJKL:EJBAIDLK",
  "ABDEHJKL:EJBDAHLK", "ABDEHIKL:EIBDAHLK", "ABDEHIJL:EJBDAHLI", "ABDEHIJK:EJBDAHIK", "ABDEGJKL:EJBDAGLK",
  "ABDEGIKL:EGBAIDLK", "ABDEGIJL:EJBDAGLI", "ABDEGIJK:EJBDAGIK", "ABDEGHKL:EGBDAHLK", "ABDEGHJL:HJBDAGLE",
  "ABDEGHJK:HJBDAGEK", "ABDEGHIL:EGBDAHLI", "ABDEGHIK:EGBDAHIK", "ABDEGHIJ:HJBDAGEI", "ABDEFJKL:EJBDAFLK",
  "ABDEFIKL:EIBDAFLK", "ABDEFIJL:EJBDAFLI", "ABDEFIJK:EJBDAFIK", "ABDEFHKL:HEBDAFLK", "ABDEFHJL:HJBDAFLE",
  "ABDEFHJK:HJBDAFEK", "ABDEFHIL:HEBDAFLI", "ABDEFHIK:HEBDAFIK", "ABDEFHIJ:HJBDAFEI", "ABDEFGKL:EGBDAFLK",
  "ABDEFGJL:EGBDAFLJ", "ABDEFGJK:EGBDAFJK", "ABDEFGIL:EGBDAFLI", "ABDEFGIK:EGBDAFIK", "ABDEFGIJ:EGBDAFIJ",
  "ABDEFGHL:HGBDAFLE", "ABDEFGHK:HGBDAFEK", "ABDEFGHJ:HGBDAFEJ", "ABDEFGHI:HGBDAFEI", "ABCHIJKL:IJBCAHLK",
  "ABCGIJKL:IJBCAGLK", "ABCGHJKL:HJBCAGLK", "ABCGHIKL:IGBCAHLK", "ABCGHIJL:HJBCAGLI", "ABCGHIJK:HJBCAGIK",
  "ABCFIJKL:IJBCAFLK", "ABCFHJKL:HJBCAFLK", "ABCFHIKL:HIBCAFLK", "ABCFHIJL:HJBCAFLI", "ABCFHIJK:HJBCAFIK",
  "ABCFGJKL:CJBFAGLK", "ABCFGIKL:IGBCAFLK", "ABCFGIJL:CJBFAGLI", "ABCFGIJK:CJBFAGIK", "ABCFGHKL:HGBCAFLK",
  "ABCFGHJL:HGBCAFLJ", "ABCFGHJK:HGBCAFJK", "ABCFGHIL:HGBCAFLI", "ABCFGHIK:HGBCAFIK", "ABCFGHIJ:HGBCAFIJ",
  "ABCEIJKL:EJBAICLK", "ABCEHJKL:EJBCAHLK", "ABCEHIKL:EIBCAHLK", "ABCEHIJL:EJBCAHLI", "ABCEHIJK:EJBCAHIK",
  "ABCEGJKL:EJBCAGLK", "ABCEGIKL:EGBAICLK", "ABCEGIJL:EJBCAGLI", "ABCEGIJK:EJBCAGIK", "ABCEGHKL:EGBCAHLK",
  "ABCEGHJL:HJBCAGLE", "ABCEGHJK:HJBCAGEK", "ABCEGHIL:EGBCAHLI", "ABCEGHIK:EGBCAHIK", "ABCEGHIJ:HJBCAGEI",
  "ABCEFJKL:EJBCAFLK", "ABCEFIKL:EIBCAFLK", "ABCEFIJL:EJBCAFLI", "ABCEFIJK:EJBCAFIK", "ABCEFHKL:HEBCAFLK",
  "ABCEFHJL:HJBCAFLE", "ABCEFHJK:HJBCAFEK", "ABCEFHIL:HEBCAFLI", "ABCEFHIK:HEBCAFIK", "ABCEFHIJ:HJBCAFEI",
  "ABCEFGKL:EGBCAFLK", "ABCEFGJL:EGBCAFLJ", "ABCEFGJK:EGBCAFJK", "ABCEFGIL:EGBCAFLI", "ABCEFGIK:EGBCAFIK",
  "ABCEFGIJ:EGBCAFIJ", "ABCEFGHL:HGBCAFLE", "ABCEFGHK:HGBCAFEK", "ABCEFGHJ:HGBCAFEJ", "ABCEFGHI:HGBCAFEI",
  "ABCDIJKL:IJBCADLK", "ABCDHJKL:HJBCADLK", "ABCDHIKL:HIBCADLK", "ABCDHIJL:HJBCADLI", "ABCDHIJK:HJBCADIK",
  "ABCDGJKL:CJBDAGLK", "ABCDGIKL:IGBCADLK", "ABCDGIJL:CJBDAGLI", "ABCDGIJK:CJBDAGIK", "ABCDGHKL:HGBCADLK",
  "ABCDGHJL:HGBCADLJ", "ABCDGHJK:HGBCADJK", "ABCDGHIL:HGBCADLI", "ABCDGHIK:HGBCADIK", "ABCDGHIJ:HGBCADIJ",
  "ABCDFJKL:CJBDAFLK", "ABCDFIKL:CIBDAFLK", "ABCDFIJL:CJBDAFLI", "ABCDFIJK:CJBDAFIK", "ABCDFHKL:HFBCADLK",
  "ABCDFHJL:CJBDAFLH", "ABCDFHJK:HJBCAFDK", "ABCDFHIL:HFBCADLI", "ABCDFHIK:HFBCADIK", "ABCDFHIJ:HJBCAFDI",
  "ABCDFGKL:CGBDAFLK", "ABCDFGJL:CGBDAFLJ", "ABCDFGJK:CGBDAFJK", "ABCDFGIL:CGBDAFLI", "ABCDFGIK:CGBDAFIK",
  "ABCDFGIJ:CGBDAFIJ", "ABCDFGHL:CGBDAFLH", "ABCDFGHK:HGBCAFDK", "ABCDFGHJ:HGBCAFDJ", "ABCDFGHI:HGBCAFDI",
  "ABCDEJKL:EJBCADLK", "ABCDEIKL:EIBCADLK", "ABCDEIJL:EJBCADLI", "ABCDEIJK:EJBCADIK", "ABCDEHKL:HEBCADLK",
  "ABCDEHJL:HJBCADLE", "ABCDEHJK:HJBCADEK", "ABCDEHIL:HEBCADLI", "ABCDEHIK:HEBCADIK", "ABCDEHIJ:HJBCADEI",
  "ABCDEGKL:EGBCADLK", "ABCDEGJL:EGBCADLJ", "ABCDEGJK:EGBCADJK", "ABCDEGIL:EGBCADLI", "ABCDEGIK:EGBCADIK",
  "ABCDEGIJ:EGBCADIJ", "ABCDEGHL:HGBCADLE", "ABCDEGHK:HGBCADEK", "ABCDEGHJ:HGBCADEJ", "ABCDEGHI:HGBCADEI",
  "ABCDEFKL:CEBDAFLK", "ABCDEFJL:CJBDAFLE", "ABCDEFJK:CJBDAFEK", "ABCDEFIL:CEBDAFLI", "ABCDEFIK:CEBDAFIK",
  "ABCDEFIJ:CJBDAFEI", "ABCDEFHL:HFBCADLE", "ABCDEFHK:HEBCAFDK", "ABCDEFHJ:HJBCAFDE", "ABCDEFHI:HEBCAFDI",
  "ABCDEFGL:CGBDAFLE", "ABCDEFGK:CGBDAFEK", "ABCDEFGJ:CGBDAFEJ", "ABCDEFGI:CGBDAFEI", "ABCDEFGH:HGBCAFDE",
];

const THIRD_PLACE_ASSIGNMENTS = Object.fromEntries(
  THIRD_PLACE_ASSIGNMENT_ROWS.map((row) => {
    const [qualifiedGroups, assignments] = row.split(":");
    return [
      qualifiedGroups,
      Object.fromEntries(THIRD_PLACE_ASSIGNMENT_COLUMNS.map((groupId, index) => [groupId, assignments[index]])),
    ];
  }),
);

const teams = WORLD_CUP_DATA.groups.flatMap((group) =>
  group.teams.map((name, index) => ({
    id: `${group.id}${index + 1}`,
    groupId: group.id,
    name,
  })),
);

const teamById = Object.fromEntries(teams.map((team) => [team.id, team]));
const flagByTeamId = {
  A1: "🇲🇽",
  A2: "🇿🇦",
  A3: "🇰🇷",
  A4: "🇨🇿",
  B1: "🇨🇦",
  B2: "🇧🇦",
  B3: "🇶🇦",
  B4: "🇨🇭",
  C1: "🇧🇷",
  C2: "🇲🇦",
  C3: "🇭🇹",
  C4: "🏴",
  D1: "🇺🇸",
  D2: "🇵🇾",
  D3: "🇦🇺",
  D4: "🇹🇷",
  E1: "🇩🇪",
  E2: "🇨🇼",
  E3: "🇨🇮",
  E4: "🇪🇨",
  F1: "🇳🇱",
  F2: "🇯🇵",
  F3: "🇸🇪",
  F4: "🇹🇳",
  G1: "🇧🇪",
  G2: "🇪🇬",
  G3: "🇮🇷",
  G4: "🇳🇿",
  H1: "🇪🇸",
  H2: "🇨🇻",
  H3: "🇸🇦",
  H4: "🇺🇾",
  I1: "🇫🇷",
  I2: "🇸🇳",
  I3: "🇮🇶",
  I4: "🇳🇴",
  J1: "🇦🇷",
  J2: "🇩🇿",
  J3: "🇦🇹",
  J4: "🇯🇴",
  K1: "🇵🇹",
  K2: "🇨🇩",
  K3: "🇺🇿",
  K4: "🇨🇴",
  L1: "🏴",
  L2: "🇭🇷",
  L3: "🇬🇭",
  L4: "🇵🇦",
};

const matches = buildMatches(WORLD_CUP_DATA);

const defaultState = {
  activePlayerId: "",
  players: [],
  predictions: {},
  results: {
    matches: {},
    groupWinners: {},
    stages: {},
  },
  scoring: structuredClone(WORLD_CUP_DATA.scoring),
};

let state = structuredClone(defaultState);
let submission = loadSubmission();

const els = {
  activePlayer: document.querySelector("#active-player"),
  playerForm: document.querySelector("#player-form"),
  playerName: document.querySelector("#player-name"),
  playerList: document.querySelector("#player-list"),
  scoreboardBody: document.querySelector("#scoreboard-body"),
  statsGrid: document.querySelector("#stats-grid"),
  noPlayerNotice: document.querySelector("#no-player-notice"),
  submitPlayerName: document.querySelector("#submit-player-name"),
  submitMatches: document.querySelector("#submit-matches"),
  submitGroups: document.querySelector("#submit-groups"),
  submitStages: document.querySelector("#submit-stages"),
  downloadSubmission: document.querySelector("#download-submission"),
  viewerPlayer: document.querySelector("#viewer-player"),
  shareViewer: document.querySelector("#share-viewer"),
  viewerEmpty: document.querySelector("#viewer-empty"),
  viewerContent: document.querySelector("#viewer-content"),
  viewerMatches: document.querySelector("#viewer-matches"),
  viewerGroups: document.querySelector("#viewer-groups"),
  viewerStages: document.querySelector("#viewer-stages"),
  matrixEmpty: document.querySelector("#matrix-empty"),
  matrixMatches: document.querySelector("#matrix-matches"),
  matrixGroups: document.querySelector("#matrix-groups"),
  matrixStages: document.querySelector("#matrix-stages"),
  predictionMatches: document.querySelector("#prediction-matches"),
  predictionGroups: document.querySelector("#prediction-groups"),
  predictionStages: document.querySelector("#prediction-stages"),
  resultMatches: document.querySelector("#result-matches"),
  resultGroups: document.querySelector("#result-groups"),
  resultStages: document.querySelector("#result-stages"),
  rulesGrid: document.querySelector("#rules-grid"),
  importData: document.querySelector("#import-data"),
  modeLabel: document.querySelector("#mode-label"),
  modeHelp: document.querySelector("#mode-help"),
};

function mergeState(rawState) {
  const parsed = rawState || {};
  return {
    ...structuredClone(defaultState),
    ...parsed,
    results: {
      ...structuredClone(defaultState.results),
      ...(parsed.results || {}),
    },
    scoring: {
      ...structuredClone(defaultState.scoring),
      ...(parsed.scoring || {}),
      stages: {
        ...defaultState.scoring.stages,
        ...(parsed.scoring?.stages || {}),
      },
    },
  };
}

async function loadInitialState() {
  if (IS_ADMIN) {
    return loadLocalState();
  }

  try {
    const response = await fetch(`${PUBLISHED_STATE_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return mergeState(await response.json());
  } catch {
    return loadLocalState();
  }
}

function loadLocalState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(defaultState);

  try {
    return mergeState(JSON.parse(saved));
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  if (!IS_ADMIN) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSubmission() {
  const saved = localStorage.getItem(SUBMISSION_KEY);
  if (saved) {
    try {
      return {
        id: crypto.randomUUID(),
        name: "",
        matches: {},
        groupWinners: {},
        stages: {},
        ...JSON.parse(saved),
      };
    } catch {
      // Fall through to a new blank submission.
    }
  }

  return {
    id: crypto.randomUUID(),
    name: "",
    matches: {},
    groupWinners: {},
    stages: {},
  };
}

function saveSubmission() {
  localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission));
}

function ensurePlayerPrediction(playerId) {
  if (!playerId) return null;
  if (!state.predictions[playerId]) {
    state.predictions[playerId] = {
      matches: {},
      groupWinners: {},
      stages: {},
    };
  }
  return state.predictions[playerId];
}

function normalizeScore(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return "";
  return Math.min(number, 99);
}

function getOutcome(score) {
  if (!hasScore(score)) return "";
  if (score.home > score.away) return "home";
  if (score.home < score.away) return "away";
  return "draw";
}

function hasScore(score) {
  return Number.isInteger(score?.home) && Number.isInteger(score?.away);
}

function scoreMatch(prediction, result) {
  if (!hasScore(prediction) || !hasScore(result)) return { points: 0, exact: 0, tendency: 0 };
  if (prediction.home === result.home && prediction.away === result.away) {
    return { points: state.scoring.exactScore, exact: 1, tendency: 0 };
  }
  if (getOutcome(prediction) === getOutcome(result)) {
    return { points: state.scoring.tendency, exact: 0, tendency: 1 };
  }
  return { points: 0, exact: 0, tendency: 0 };
}

function calculatePlayerScore(player) {
  const prediction = ensurePlayerPrediction(player.id);
  const breakdown = {
    player,
    total: 0,
    exact: 0,
    tendency: 0,
    groupWinners: 0,
    stages: 0,
  };

  matches.forEach((match) => {
    const matchScore = scoreMatch(prediction.matches[match.id], state.results.matches[match.id]);
    breakdown.total += matchScore.points;
    breakdown.exact += matchScore.exact;
    breakdown.tendency += matchScore.tendency;
  });

  WORLD_CUP_DATA.groups.forEach((group) => {
    if (prediction.groupWinners[group.id] && prediction.groupWinners[group.id] === state.results.groupWinners[group.id]) {
      breakdown.total += state.scoring.groupWinner;
      breakdown.groupWinners += state.scoring.groupWinner;
    }
  });

  WORLD_CUP_DATA.stageMeta.forEach((stage) => {
    const predicted = new Set(prediction.stages[stage.id] || []);
    const actual = new Set(state.results.stages[stage.id] || []);
    predicted.forEach((teamId) => {
      if (actual.has(teamId)) {
        breakdown.total += state.scoring.stages[stage.id];
        breakdown.stages += state.scoring.stages[stage.id];
      }
    });
  });

  return breakdown;
}

function render() {
  if (!state.activePlayerId && state.players.length) {
    state.activePlayerId = state.players[0].id;
  }
  if (state.activePlayerId && !state.players.some((player) => player.id === state.activePlayerId)) {
    state.activePlayerId = state.players[0]?.id || "";
  }

  renderPlayerSelect();
  renderPlayers();
  renderPredictions();
  renderSubmission();
  renderViewer();
  renderMatrix();
  renderResults();
  renderRules();
  renderDashboard();
  renderMode();
  saveState();
}

function activateView(viewName, options = {}) {
  const button = document.querySelector(`[data-view="${viewName}"]`);
  if (!button) return;
  if (button.dataset.adminOnly !== undefined && !IS_ADMIN) return;

  document.querySelectorAll(".nav-button").forEach((navButton) => navButton.classList.toggle("is-active", navButton === button));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("is-active", view.id === `view-${viewName}`));

  if (options.updateHash !== false) {
    const nextHash = VIEW_HASHES[viewName] || viewName;
    if (window.location.hash.slice(1) !== nextHash) {
      history.pushState(null, "", `#${nextHash}`);
    }
  }
}

function parseHash() {
  const raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  const [hashBase, ...rest] = raw.split("/");
  const viewName = VIEW_BY_HASH[hashBase] || hashBase || "dashboard";
  return { viewName, param: rest.join("/") };
}

function activateViewFromHash() {
  const { viewName, param } = parseHash();
  if (viewName === "viewer" && param && state.players.some((player) => player.id === param)) {
    els.viewerPlayer.dataset.selected = param;
    renderViewer();
  }
  activateView(viewName, { updateHash: false });
}

function updateViewerHash(playerId) {
  const base = VIEW_HASHES.viewer;
  const nextHash = playerId ? `${base}/${playerId}` : base;
  if (window.location.hash.slice(1) !== nextHash) {
    history.replaceState(null, "", `#${nextHash}`);
  }
}

function buildViewerShareUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("admin");
  const playerId = els.viewerPlayer.value;
  url.hash = playerId ? `${VIEW_HASHES.viewer}/${playerId}` : VIEW_HASHES.viewer;
  return url.toString();
}

function renderViewer() {
  els.viewerPlayer.innerHTML = "";
  if (!state.players.length) {
    els.viewerEmpty.hidden = false;
    els.viewerContent.hidden = true;
    els.viewerPlayer.disabled = true;
    els.viewerPlayer.append(new Option("Keine Teilnehmer", ""));
    return;
  }

  els.viewerEmpty.hidden = true;
  els.viewerContent.hidden = false;
  els.viewerPlayer.disabled = false;

  const selectedId = els.viewerPlayer.dataset.selected && state.players.some((player) => player.id === els.viewerPlayer.dataset.selected)
    ? els.viewerPlayer.dataset.selected
    : state.players[0].id;

  state.players.forEach((player) => {
    els.viewerPlayer.append(new Option(player.name, player.id, false, player.id === selectedId));
  });
  els.viewerPlayer.dataset.selected = selectedId;

  const prediction = state.predictions[selectedId] || { matches: {}, groupWinners: {}, stages: {} };
  els.viewerMatches.innerHTML = renderViewerMatches(prediction.matches);
  els.viewerGroups.innerHTML = renderViewerGroups(prediction.groupWinners);
  els.viewerStages.innerHTML = renderViewerStages(prediction.stages);
}

function renderViewerMatches(values) {
  return WORLD_CUP_DATA.groups
    .map((group) => {
      const rows = matches
        .filter((match) => match.groupId === group.id)
        .map((match) => {
          const score = values[match.id];
          const result = state.results.matches[match.id];
          const points = scoreMatch(score, result).points;
          return `
            <tr>
              <td>${match.label}</td>
              <td>${teamName(match.homeId)}</td>
              <td class="viewer-score">${formatScore(score)}</td>
              <td>${teamName(match.awayId)}</td>
              <td>${formatScore(result)}</td>
              <td><strong>${points}</strong></td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="group-block">
          <h3>Gruppe ${group.id}</h3>
          <table class="match-table viewer-table">
            <thead>
              <tr>
                <th>Spiel</th>
                <th>Heim</th>
                <th>Tipp</th>
                <th>Auswärts</th>
                <th>Ergebnis</th>
                <th>Punkte</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function renderViewerGroups(values) {
  return `
    <div class="group-winner-grid">
      ${WORLD_CUP_DATA.groups
        .map((group) => {
          const tip = values[group.id];
          const result = state.results.groupWinners[group.id];
          const points = tip && tip === result ? state.scoring.groupWinner : 0;
          return `
            <div class="select-card">
              <span>Gruppe ${group.id}</span>
              <strong>${tip ? teamName(tip) : "Kein Tipp"}</strong>
              <small>Ergebnis: ${result ? teamName(result) : "offen"} · ${points} Punkte</small>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderViewerStages(values) {
  return `
    <div class="stage-grid">
      ${WORLD_CUP_DATA.stageMeta
        .map((stage) => {
          const selected = values[stage.id] || [];
          const actual = new Set(state.results.stages[stage.id] || []);
          return `
            <section class="stage-block">
              <div class="stage-head">
                <h3>${stage.label}</h3>
                <span>${selected.length}/${stage.size}</span>
              </div>
              <div class="viewer-chip-list">
                ${
                  selected.length
                    ? selected
                        .map((teamId) => `<span class="viewer-chip ${actual.has(teamId) ? "is-hit" : ""}">${teamName(teamId)}</span>`)
                        .join("")
                    : `<span class="empty-inline">Kein Tipp</span>`
                }
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function matchHitClass(prediction, result) {
  if (!hasScore(prediction) || !hasScore(result)) return "";
  const { exact, tendency } = scoreMatch(prediction, result);
  if (exact) return "is-exact";
  if (tendency) return "is-tendency";
  return "is-miss";
}

function renderMatrix() {
  const hasPlayers = state.players.length > 0;
  els.matrixEmpty.hidden = hasPlayers;
  document.querySelector("#matrix-tabs").hidden = !hasPlayers;
  els.matrixMatches.hidden = !hasPlayers;
  els.matrixGroups.hidden = !hasPlayers;
  els.matrixStages.hidden = !hasPlayers;
  if (!hasPlayers) {
    els.matrixMatches.innerHTML = "";
    els.matrixGroups.innerHTML = "";
    els.matrixStages.innerHTML = "";
    return;
  }

  els.matrixMatches.innerHTML = renderMatrixMatches();
  els.matrixGroups.innerHTML = renderMatrixGroups();
  els.matrixStages.innerHTML = renderMatrixStages();
}

function matrixPlayerHeaders() {
  return state.players.map((player) => `<th class="matrix-player">${escapeHtml(player.name)}</th>`).join("");
}

function renderMatrixMatches() {
  const legend = `
    <div class="auto-note matrix-legend">
      <span class="legend-item"><i class="swatch is-exact"></i> Exaktes Ergebnis</span>
      <span class="legend-item"><i class="swatch is-tendency"></i> Richtige Tendenz</span>
      <span class="legend-item"><i class="swatch is-miss"></i> Daneben</span>
    </div>
  `;

  const groups = WORLD_CUP_DATA.groups
    .map((group) => {
      const rows = matches
        .filter((match) => match.groupId === group.id)
        .map((match) => {
          const result = state.results.matches[match.id];
          const cells = state.players
            .map((player) => {
              const tip = state.predictions[player.id]?.matches?.[match.id];
              return `<td class="matrix-cell ${matchHitClass(tip, result)}">${formatScore(tip)}</td>`;
            })
            .join("");
          return `
            <tr>
              <th class="matrix-fixed" scope="row">
                <span class="matrix-fixture">${matrixTeam(match.homeId)} <em>:</em> ${matrixTeam(match.awayId)}</span>
              </th>
              <td class="matrix-result">${formatScore(result)}</td>
              ${cells}
            </tr>
          `;
        })
        .join("");

      return `
        <section class="group-block">
          <h3>Gruppe ${group.id}</h3>
          <div class="matrix-scroll">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="matrix-fixed">Begegnung</th>
                  <th class="matrix-result">Ergebnis</th>
                  ${matrixPlayerHeaders()}
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>
      `;
    })
    .join("");

  return legend + groups;
}

function renderMatrixGroups() {
  const rows = WORLD_CUP_DATA.groups
    .map((group) => {
      const result = state.results.groupWinners[group.id];
      const cells = state.players
        .map((player) => {
          const tip = state.predictions[player.id]?.groupWinners?.[group.id];
          const hit = tip && result ? (tip === result ? "is-exact" : "is-miss") : "";
          return `<td class="matrix-cell ${hit}">${tip ? teamName(tip) : "–"}</td>`;
        })
        .join("");
      return `
        <tr>
          <th class="matrix-fixed" scope="row">Gruppe ${group.id}</th>
          <td class="matrix-result">${result ? teamName(result) : "–"}</td>
          ${cells}
        </tr>
      `;
    })
    .join("");

  return `
    <section class="group-block">
      <h3>Gruppensieger</h3>
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-fixed">Gruppe</th>
              <th class="matrix-result">Ergebnis</th>
              ${matrixPlayerHeaders()}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderMatrixStages() {
  return `
    <div class="stage-grid">
      ${WORLD_CUP_DATA.stageMeta
        .map((stage) => {
          const actual = new Set(state.results.stages[stage.id] || []);
          const rows = state.players
            .map((player) => {
              const picks = state.predictions[player.id]?.stages?.[stage.id] || [];
              const chips = picks.length
                ? picks
                    .map((teamId) => `<span class="viewer-chip ${actual.has(teamId) ? "is-hit" : ""}">${teamName(teamId)}</span>`)
                    .join("")
                : `<span class="empty-inline">Kein Tipp</span>`;
              return `
                <tr>
                  <th class="matrix-fixed" scope="row">${escapeHtml(player.name)}</th>
                  <td><div class="viewer-chip-list">${chips}</div></td>
                </tr>
              `;
            })
            .join("");

          return `
            <section class="stage-block">
              <div class="stage-head">
                <h3>${stage.label}</h3>
                <span>${stage.size} Teams</span>
              </div>
              <table class="matrix-stage-table">
                <tbody>${rows}</tbody>
              </table>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSubmission() {
  syncSubmissionDerivedPredictions();
  els.submitPlayerName.value = submission.name || "";
  els.submitMatches.innerHTML = renderMatchInputs("submit", submission.matches);
  els.submitGroups.innerHTML = renderComputedGroupTables(submission.matches);
  els.submitStages.innerHTML = renderSubmissionBracket();
}

function renderMode() {
  document.body.classList.toggle("is-admin", IS_ADMIN);
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !IS_ADMIN;
  });
  els.modeLabel.textContent = IS_ADMIN ? "Admin-Modus" : "Lesemodus";
  els.modeHelp.textContent = IS_ADMIN
    ? "Änderungen bleiben lokal, bis du die JSON-Datei exportierst und ins Repository lädst."
    : "Die Seite liest die veröffentlichte JSON-Datei aus dem Repository.";
}

function renderPlayerSelect() {
  els.activePlayer.innerHTML = "";
  if (!state.players.length) {
    els.activePlayer.append(new Option("Keine Teilnehmer", ""));
    els.activePlayer.disabled = true;
    return;
  }
  els.activePlayer.disabled = false;
  state.players.forEach((player) => {
    els.activePlayer.append(new Option(player.name, player.id, false, player.id === state.activePlayerId));
  });
}

function renderPlayers() {
  els.playerList.innerHTML = "";
  if (!state.players.length) {
    els.playerList.innerHTML = `<p class="empty">Noch keine Teilnehmer angelegt.</p>`;
    return;
  }

  state.players.forEach((player) => {
    const row = document.createElement("div");
    row.className = "player-row";
    row.innerHTML = `
      <span>${escapeHtml(player.name)}</span>
      <div class="row-actions">
        <button type="button" data-set-player="${player.id}">Auswählen</button>
        <button type="button" class="danger-button" data-delete-player="${player.id}">Löschen</button>
      </div>
    `;
    els.playerList.append(row);
  });
}

function renderPredictions() {
  const prediction = ensurePlayerPrediction(state.activePlayerId);
  const hasPlayer = Boolean(prediction);
  els.noPlayerNotice.hidden = hasPlayer;
  document.querySelector("#prediction-tabs").hidden = !hasPlayer;
  els.predictionMatches.hidden = !hasPlayer;
  els.predictionGroups.hidden = !hasPlayer;
  els.predictionStages.hidden = !hasPlayer;

  if (!hasPlayer) return;

  els.predictionMatches.innerHTML = renderMatchInputs("prediction", prediction.matches);
  els.predictionGroups.innerHTML = renderGroupWinnerInputs("prediction", prediction.groupWinners);
  els.predictionStages.innerHTML = renderStageInputs("prediction", prediction.stages);
}

function renderResults() {
  els.resultMatches.innerHTML = renderMatchInputs("result", state.results.matches);
  els.resultGroups.innerHTML = renderGroupWinnerInputs("result", state.results.groupWinners);
  els.resultStages.innerHTML = renderStageInputs("result", state.results.stages);
}

function renderMatchInputs(scope, values) {
  return WORLD_CUP_DATA.groups
    .map((group) => {
      const groupMatches = matches.filter((match) => match.groupId === group.id);
      const rows = groupMatches
        .map((match) => {
          const value = values[match.id] || {};
          return `
            <tr>
              <td class="muted">${match.label}</td>
              <td>${teamName(match.homeId)}</td>
              <td class="score-inputs">
                <input type="number" min="0" max="99" inputmode="numeric" value="${value.home ?? ""}" data-${scope}-match="${match.id}" data-side="home" aria-label="${teamName(match.homeId)} Tore" />
                <span>:</span>
                <input type="number" min="0" max="99" inputmode="numeric" value="${value.away ?? ""}" data-${scope}-match="${match.id}" data-side="away" aria-label="${teamName(match.awayId)} Tore" />
              </td>
              <td>${teamName(match.awayId)}</td>
            </tr>
          `;
        })
        .join("");

      return `
        <section class="group-block">
          <h3>Gruppe ${group.id}</h3>
          <table class="match-table">
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");
}

function renderGroupWinnerInputs(scope, values) {
  return `
    <div class="group-winner-grid">
      ${WORLD_CUP_DATA.groups
        .map((group) => {
          const groupTeams = teams.filter((team) => team.groupId === group.id);
          return `
            <label class="select-card">
              <span>Gruppe ${group.id}</span>
              <select data-${scope}-group="${group.id}">
                <option value="">Offen</option>
                ${groupTeams
                  .map((team) => `<option value="${team.id}" ${values[group.id] === team.id ? "selected" : ""}>${escapeHtml(team.name)}</option>`)
                  .join("")}
              </select>
            </label>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderComputedGroupTables(scoreMap) {
  const tables = calculateGroupTables(scoreMap);
  return `
    <div class="auto-note">Die Gruppensieger werden aus deinen Vorrunden-Tipps berechnet. Bei Punktegleichheit zählen Tordifferenz, erzielte Tore und dann die ursprüngliche Gruppenreihenfolge.</div>
    <div class="computed-group-grid">
      ${WORLD_CUP_DATA.groups
        .map((group) => {
          const rows = tables[group.id]
            .map(
              (row, index) => `
                <tr class="${index === 0 ? "is-winner" : ""}">
                  <td>${index + 1}</td>
                  <td>${escapeHtml(teamName(row.teamId))}</td>
                  <td>${row.gf}:${row.ga}</td>
                  <td>${row.gd}</td>
                  <td><strong>${row.points}</strong></td>
                </tr>
              `,
            )
            .join("");

          return `
            <section class="group-block">
              <h3>Gruppe ${group.id}</h3>
              <table class="computed-table">
                <thead>
                  <tr>
                    <th>Pl.</th>
                    <th>Team</th>
                    <th>Tore</th>
                    <th>Diff.</th>
                    <th>Pkt.</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderSubmissionBracket() {
  const qualifiers = getPredictedQualifiers(submission.matches);
  if (qualifiers.length < 32) {
    return `<div class="notice">Fülle zuerst genug Vorrundenspiele aus, damit die qualifizierten Teams berechnet werden können.</div>`;
  }

  const rounds = [
    { id: "round32", target: "round16", label: "Runde der letzten 32", pairs: buildRound32Pairs(qualifiers) },
    { id: "round16", target: "quarter", label: "Achtelfinale", pairs: pairTeams(submission.stages.round16 || [], 8) },
    { id: "quarter", target: "semi", label: "Viertelfinale", pairs: pairTeams(submission.stages.quarter || [], 4) },
    { id: "semi", target: "final", label: "Halbfinale", pairs: pairTeams(submission.stages.semi || [], 2) },
    { id: "final", target: "champion", label: "Finale", pairs: pairTeams(submission.stages.final || [], 1) },
  ];

  return `
    <div class="auto-note">Klicke in jeder Paarung auf den Sieger. Die nächste Runde wird danach automatisch aufgebaut.</div>
    <div class="bracket">
      ${rounds
        .map(
          (round) => `
            <section class="bracket-round">
              <div class="stage-head">
                <h3>${round.label}</h3>
                <span>${getRoundProgress(round.id, round.target)}/${round.pairs.length}</span>
              </div>
              <div class="bracket-pairs">
                ${round.pairs
                  .map((pair, pairIndex) => renderBracketPair(round.id, round.target, pair, pairIndex))
                  .join("")}
              </div>
            </section>
          `,
        )
        .join("")}
      <section class="bracket-round champion-round">
        <div class="stage-head">
          <h3>Weltmeister</h3>
          <span>${submission.stages.champion?.length || 0}/1</span>
        </div>
        <div class="champion-box">${submission.stages.champion?.[0] ? teamName(submission.stages.champion[0]) : "Noch offen"}</div>
      </section>
    </div>
  `;
}

function renderBracketPair(roundId, targetStage, pair, pairIndex) {
  const selected = targetStage === "champion" ? submission.stages.champion?.[0] : submission.stages[targetStage]?.[pairIndex];
  const [home, away] = pair;
  return `
    <div class="bracket-pair">
      ${renderBracketTeam(roundId, pairIndex, home, selected)}
      ${renderBracketTeam(roundId, pairIndex, away, selected)}
    </div>
  `;
}

function renderBracketTeam(roundId, pairIndex, teamId, selected) {
  if (!teamId) {
    return `<button class="bracket-team is-placeholder" type="button" disabled>Offen</button>`;
  }

  return `
    <button class="bracket-team ${selected === teamId ? "is-selected" : ""}" type="button" data-bracket-winner="${teamId}" data-source-stage="${roundId}" data-pair-index="${pairIndex}">
      ${escapeHtml(teamName(teamId))}
    </button>
  `;
}

function getRoundProgress(roundId, targetStage) {
  if (roundId === "round32") return (submission.stages.round16 || []).filter(Boolean).length;
  if (targetStage === "champion") return (submission.stages.champion || []).filter(Boolean).length;
  return (submission.stages[targetStage] || []).filter(Boolean).length;
}

function renderStageInputs(scope, values) {
  return `
    <div class="stage-grid">
      ${WORLD_CUP_DATA.stageMeta
        .map((stage) => {
          const selected = new Set(values[stage.id] || []);
          const selectedCount = selected.size;
          return `
            <section class="stage-block">
              <div class="stage-head">
                <h3>${stage.label}</h3>
                <span>${selectedCount}/${stage.size}</span>
              </div>
              <div class="team-picker" data-${scope}-stage="${stage.id}">
                ${teams
                  .map(
                    (team) => `
                      <label class="team-chip ${selected.has(team.id) ? "is-selected" : ""}">
                        <input type="checkbox" value="${team.id}" ${selected.has(team.id) ? "checked" : ""} />
                        <span>${escapeHtml(team.name)}</span>
                      </label>
                    `,
                  )
                  .join("")}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderRules() {
  const matchRules = [
    { key: "tendency", label: "Richtige Tendenz", value: state.scoring.tendency },
    { key: "exactScore", label: "Exaktes Ergebnis", value: state.scoring.exactScore },
    { key: "groupWinner", label: "Richtiger Gruppensieger", value: state.scoring.groupWinner },
  ];

  const stageRules = WORLD_CUP_DATA.stageMeta.map((stage) => ({
    key: stage.id,
    label: `${stage.label} pro Team`,
    value: state.scoring.stages[stage.id],
    stage: true,
  }));

  els.rulesGrid.innerHTML = [...matchRules, ...stageRules]
    .map(
      (rule) => `
        <label class="rule-card">
          <span>${rule.label}</span>
          <input type="number" min="0" max="99" value="${rule.value}" data-score-key="${rule.key}" ${rule.stage ? "data-stage-score=\"true\"" : ""} ${IS_ADMIN ? "" : "disabled"} />
        </label>
      `,
    )
    .join("");
}

function renderDashboard() {
  const standings = state.players.map(calculatePlayerScore).sort((a, b) => b.total - a.total || a.player.name.localeCompare(b.player.name));
  els.scoreboardBody.innerHTML = standings.length
    ? standings
        .map(
          (row, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${escapeHtml(row.player.name)}</td>
              <td><strong>${row.total}</strong></td>
              <td>${row.exact}</td>
              <td>${row.tendency}</td>
              <td>${row.groupWinners}</td>
              <td>${row.stages}</td>
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="7" class="empty">Noch keine Teilnehmer.</td></tr>`;

  const completedMatches = matches.filter((match) => hasScore(state.results.matches[match.id])).length;
  const completedGroups = Object.values(state.results.groupWinners).filter(Boolean).length;
  const completedStages = WORLD_CUP_DATA.stageMeta.reduce((sum, stage) => sum + (state.results.stages[stage.id]?.length || 0), 0);

  els.statsGrid.innerHTML = [
    ["Teilnehmer", state.players.length],
    ["Vorrundenspiele", `${completedMatches}/${matches.length}`],
    ["Gruppensieger", `${completedGroups}/${WORLD_CUP_DATA.groups.length}`],
    ["K.-o.-Einträge", completedStages],
  ]
    .map(([label, value]) => `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function teamName(teamId) {
  const team = teamById[teamId];
  if (!team) return "Unbekannt";
  return `${flagByTeamId[teamId] || "🏳️"} ${team.name}`;
}

function matrixTeam(teamId) {
  const team = teamById[teamId];
  const flag = flagByTeamId[teamId] || "🏳️";
  const name = team ? team.name : "Unbekannt";
  return `<span class="mx-team"><span class="mx-flag">${flag}</span><span class="mx-name">${escapeHtml(name)}</span></span>`;
}

function calculateGroupTables(scoreMap) {
  const tables = {};

  WORLD_CUP_DATA.groups.forEach((group) => {
    const rows = teams
      .filter((team) => team.groupId === group.id)
      .map((team, index) => ({
        teamId: team.id,
        originalIndex: index,
        played: 0,
        points: 0,
        gf: 0,
        ga: 0,
        gd: 0,
      }));
    const rowByTeam = Object.fromEntries(rows.map((row) => [row.teamId, row]));

    matches
      .filter((match) => match.groupId === group.id)
      .forEach((match) => {
        const score = scoreMap[match.id];
        if (!hasScore(score)) return;

        const home = rowByTeam[match.homeId];
        const away = rowByTeam[match.awayId];
        home.played += 1;
        away.played += 1;
        home.gf += score.home;
        home.ga += score.away;
        away.gf += score.away;
        away.ga += score.home;

        if (score.home > score.away) {
          home.points += 3;
        } else if (score.home < score.away) {
          away.points += 3;
        } else {
          home.points += 1;
          away.points += 1;
        }
      });

    rows.forEach((row) => {
      row.gd = row.gf - row.ga;
    });

    tables[group.id] = rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.originalIndex - b.originalIndex,
    );
  });

  return tables;
}

function getAutoGroupWinners(scoreMap) {
  const tables = calculateGroupTables(scoreMap);
  return Object.fromEntries(WORLD_CUP_DATA.groups.map((group) => [group.id, tables[group.id][0]?.teamId || ""]));
}

function getPredictedQualifiers(scoreMap) {
  const tables = calculateGroupTables(scoreMap);
  const direct = [];
  const thirds = [];

  WORLD_CUP_DATA.groups.forEach((group) => {
    const table = tables[group.id];
    table.slice(0, 2).forEach((row, index) => {
      direct.push({ ...row, groupId: group.id, groupRank: index + 1 });
    });
    if (table[2]) thirds.push({ ...table[2], groupId: group.id, groupRank: 3 });
  });

  const bestThirds = thirds
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.groupId.localeCompare(b.groupId),
    )
    .slice(0, 8);

  return [...direct, ...bestThirds].sort(
    (a, b) =>
      a.groupRank - b.groupRank ||
      b.points - a.points ||
      b.gd - a.gd ||
      b.gf - a.gf ||
      a.groupId.localeCompare(b.groupId),
  );
}

function buildRound32Pairs(qualifiers) {
  const teamByFinish = Object.fromEntries(qualifiers.map((qualifier) => [`${qualifier.groupRank}${qualifier.groupId}`, qualifier.teamId]));
  const qualifiedThirdGroups = qualifiers
    .filter((qualifier) => qualifier.groupRank === 3)
    .map((qualifier) => qualifier.groupId)
    .sort()
    .join("");
  const thirdAssignments = THIRD_PLACE_ASSIGNMENTS[qualifiedThirdGroups] || {};

  return ROUND32_BRACKET_SLOTS.map(([homeSlot, awaySlot]) => [
    resolveRound32Slot(homeSlot, teamByFinish, thirdAssignments),
    resolveRound32Slot(awaySlot, teamByFinish, thirdAssignments),
  ]);
}

function resolveRound32Slot(slot, teamByFinish, thirdAssignments) {
  if (!slot.startsWith("3")) return teamByFinish[slot] || "";
  const winnerGroupId = slot[1];
  const thirdGroupId = thirdAssignments[winnerGroupId];
  return thirdGroupId ? teamByFinish[`3${thirdGroupId}`] || "" : "";
}

function pairTeams(teamIds, pairCount) {
  return Array.from({ length: pairCount }, (_, index) => [teamIds[index * 2] || "", teamIds[index * 2 + 1] || ""]);
}

function syncSubmissionDerivedPredictions() {
  submission.groupWinners = getAutoGroupWinners(submission.matches);
  const qualifiers = getPredictedQualifiers(submission.matches);
  const round32 = buildRound32Pairs(qualifiers).flat();
  const previousRound32 = (submission.stages.round32 || []).join("|");
  const nextRound32 = round32.join("|");
  submission.stages.round32 = round32;
  if (previousRound32 && previousRound32 !== nextRound32) {
    ["round16", "quarter", "semi", "final", "champion"].forEach((stageId) => {
      submission.stages[stageId] = [];
    });
  }
}

function setBracketWinner(sourceStage, pairIndex, winnerId) {
  const targetBySource = {
    round32: "round16",
    round16: "quarter",
    quarter: "semi",
    semi: "final",
    final: "champion",
  };
  const targetStage = targetBySource[sourceStage];
  if (!targetStage) return;

  if (targetStage === "champion") {
    submission.stages.champion = [winnerId];
  } else {
    const targetSize = WORLD_CUP_DATA.stageMeta.find((stage) => stage.id === targetStage)?.size || 0;
    const next = Array.from({ length: targetSize }, (_, index) => submission.stages[targetStage]?.[index] || "");
    next[pairIndex] = winnerId;
    submission.stages[targetStage] = next;
  }

  const clearableStages = ["round16", "quarter", "semi", "final", "champion"];
  const targetIndex = clearableStages.indexOf(targetStage);
  clearableStages.slice(targetIndex + 1).forEach((stageId) => {
    submission.stages[stageId] = [];
  });
}

function setNestedScore(container, matchId, side, rawValue) {
  const value = normalizeScore(rawValue);
  if (!container[matchId]) container[matchId] = {};
  if (value === "") {
    delete container[matchId][side];
  } else {
    container[matchId][side] = value;
  }
  if (!hasScore(container[matchId]) && container[matchId].home === undefined && container[matchId].away === undefined) {
    delete container[matchId];
  }
}

function handleStageToggle(container, stageId, teamId, checked) {
  const stage = WORLD_CUP_DATA.stageMeta.find((item) => item.id === stageId);
  const current = new Set(container[stageId] || []);
  if (checked && current.size >= stage.size && !current.has(teamId)) return false;
  if (checked) current.add(teamId);
  else current.delete(teamId);
  container[stageId] = [...current];
  return true;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[char];
  });
}

document.addEventListener("click", (event) => {
  const exportState = event.target.closest("[data-export-state]");
  if (exportState) {
    if (!IS_ADMIN) return;
    downloadState();
    return;
  }

  const navButton = event.target.closest("[data-view]");
  if (navButton) {
    if (navButton.dataset.adminOnly !== undefined && !IS_ADMIN) return;
    activateView(navButton.dataset.view);
  }

  const predictionTab = event.target.closest("[data-prediction-tab]");
  if (predictionTab) switchTab("prediction", predictionTab.dataset.predictionTab);

  const resultTab = event.target.closest("[data-result-tab]");
  if (resultTab) switchTab("result", resultTab.dataset.resultTab);

  const submitTab = event.target.closest("[data-submit-tab]");
  if (submitTab) switchTab("submit", submitTab.dataset.submitTab);

  const viewerTab = event.target.closest("[data-viewer-tab]");
  if (viewerTab) switchTab("viewer", viewerTab.dataset.viewerTab);

  const matrixTab = event.target.closest("[data-matrix-tab]");
  if (matrixTab) switchTab("matrix", matrixTab.dataset.matrixTab);

  const bracketWinner = event.target.closest("[data-bracket-winner]");
  if (bracketWinner) {
    setBracketWinner(bracketWinner.dataset.sourceStage, Number(bracketWinner.dataset.pairIndex), bracketWinner.dataset.bracketWinner);
    renderSubmission();
    saveSubmission();
    return;
  }

  const setPlayer = event.target.closest("[data-set-player]");
  if (setPlayer) {
    if (!IS_ADMIN) return;
    state.activePlayerId = setPlayer.dataset.setPlayer;
    render();
  }

  const deletePlayer = event.target.closest("[data-delete-player]");
  if (deletePlayer) {
    if (!IS_ADMIN) return;
    state.players = state.players.filter((player) => player.id !== deletePlayer.dataset.deletePlayer);
    delete state.predictions[deletePlayer.dataset.deletePlayer];
    if (state.activePlayerId === deletePlayer.dataset.deletePlayer) state.activePlayerId = state.players[0]?.id || "";
    render();
  }
});

document.addEventListener("input", (event) => {
  const submitMatch = event.target.closest("[data-submit-match]");
  if (submitMatch) {
    setNestedScore(submission.matches, submitMatch.dataset.submitMatch, submitMatch.dataset.side, submitMatch.value);
    syncSubmissionDerivedPredictions();
    els.submitGroups.innerHTML = renderComputedGroupTables(submission.matches);
    els.submitStages.innerHTML = renderSubmissionBracket();
    saveSubmission();
    return;
  }

  if (event.target === els.submitPlayerName) {
    submission.name = els.submitPlayerName.value.trim();
    saveSubmission();
    return;
  }

  if (!IS_ADMIN) return;

  const predictionMatch = event.target.closest("[data-prediction-match]");
  if (predictionMatch) {
    const prediction = ensurePlayerPrediction(state.activePlayerId);
    setNestedScore(prediction.matches, predictionMatch.dataset.predictionMatch, predictionMatch.dataset.side, predictionMatch.value);
    renderDashboard();
    saveState();
  }

  const resultMatch = event.target.closest("[data-result-match]");
  if (resultMatch) {
    setNestedScore(state.results.matches, resultMatch.dataset.resultMatch, resultMatch.dataset.side, resultMatch.value);
    renderDashboard();
    saveState();
  }

  const scoreInput = event.target.closest("[data-score-key]");
  if (scoreInput) {
    const value = Math.max(0, Number(scoreInput.value) || 0);
    if (scoreInput.dataset.stageScore) state.scoring.stages[scoreInput.dataset.scoreKey] = value;
    else state.scoring[scoreInput.dataset.scoreKey] = value;
    renderDashboard();
    saveState();
  }
});

document.addEventListener("change", (event) => {
  const submitGroup = event.target.closest("[data-submit-group]");
  if (submitGroup) {
    submission.groupWinners[submitGroup.dataset.submitGroup] = submitGroup.value;
    saveSubmission();
    return;
  }

  const submitStage = event.target.closest("[data-submit-stage] input");
  if (submitStage) {
    const picker = submitStage.closest("[data-submit-stage]");
    const changed = handleStageToggle(submission.stages, picker.dataset.submitStage, submitStage.value, submitStage.checked);
    if (!changed) submitStage.checked = false;
    renderSubmission();
    saveSubmission();
    return;
  }

  if (!IS_ADMIN && !event.target.matches("#active-player")) return;

  const predictionGroup = event.target.closest("[data-prediction-group]");
  if (predictionGroup) {
    const prediction = ensurePlayerPrediction(state.activePlayerId);
    prediction.groupWinners[predictionGroup.dataset.predictionGroup] = predictionGroup.value;
    renderDashboard();
    saveState();
  }

  const resultGroup = event.target.closest("[data-result-group]");
  if (resultGroup) {
    state.results.groupWinners[resultGroup.dataset.resultGroup] = resultGroup.value;
    renderDashboard();
    saveState();
  }

  const predictionStage = event.target.closest("[data-prediction-stage] input");
  if (predictionStage) {
    const prediction = ensurePlayerPrediction(state.activePlayerId);
    const picker = predictionStage.closest("[data-prediction-stage]");
    const changed = handleStageToggle(prediction.stages, picker.dataset.predictionStage, predictionStage.value, predictionStage.checked);
    if (!changed) predictionStage.checked = false;
    renderPredictions();
    renderDashboard();
  }

  const resultStage = event.target.closest("[data-result-stage] input");
  if (resultStage) {
    const picker = resultStage.closest("[data-result-stage]");
    const changed = handleStageToggle(state.results.stages, picker.dataset.resultStage, resultStage.value, resultStage.checked);
    if (!changed) resultStage.checked = false;
    renderResults();
    renderDashboard();
  }
  saveState();
});

els.activePlayer.addEventListener("change", () => {
  if (!IS_ADMIN) return;
  state.activePlayerId = els.activePlayer.value;
  render();
});

els.viewerPlayer.addEventListener("change", () => {
  els.viewerPlayer.dataset.selected = els.viewerPlayer.value;
  updateViewerHash(els.viewerPlayer.value);
  renderViewer();
});

els.shareViewer.addEventListener("click", async () => {
  if (!els.viewerPlayer.value) return;
  const shareUrl = buildViewerShareUrl();
  const original = els.shareViewer.textContent;
  try {
    await navigator.clipboard.writeText(shareUrl);
    els.shareViewer.textContent = "Link kopiert!";
  } catch {
    window.prompt("Link zum Teilen:", shareUrl);
    return;
  }
  setTimeout(() => {
    els.shareViewer.textContent = original;
  }, 1800);
});

els.playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!IS_ADMIN) return;
  const name = els.playerName.value.trim();
  if (!name) return;
  const player = { id: crypto.randomUUID(), name };
  state.players.push(player);
  state.activePlayerId = player.id;
  ensurePlayerPrediction(player.id);
  els.playerName.value = "";
  render();
});

document.querySelector("#reset-results").addEventListener("click", () => {
  if (!IS_ADMIN) return;
  state.results = structuredClone(defaultState.results);
  render();
});

document.querySelector("#load-results").addEventListener("click", loadResultsFromFeed);

document.querySelector("#copy-from-results").addEventListener("click", () => {
  if (!IS_ADMIN) return;
  const prediction = ensurePlayerPrediction(state.activePlayerId);
  if (!prediction) return;
  prediction.matches = structuredClone(state.results.matches);
  prediction.groupWinners = structuredClone(state.results.groupWinners);
  prediction.stages = structuredClone(state.results.stages);
  render();
});

async function loadResultsFromFeed() {
  if (!IS_ADMIN) return;
  const button = document.querySelector("#load-results");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Lade Ergebnisse …";

  try {
    const response = await fetch(`${RESULTS_FEED_URL}&_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const { results, stats } = mergeFeedResults({
      events: data.events || [],
      results: state.results,
      worldCupData: WORLD_CUP_DATA,
    });
    state.results = results;
    render();

    const parts = [`${stats.applied} Ergebnis(se) übernommen.`];
    if (stats.preserved) parts.push(`${stats.preserved} bereits eingetragene Ergebnis(se) wurden nicht überschrieben.`);
    if (stats.live) parts.push(`${stats.live} Spiel(e) laufen noch und wurden übersprungen.`);
    if (stats.unmatchedTeams) parts.push(`${stats.unmatchedTeams} Begegnung(en) ohne Teamzuordnung übersprungen.`);
    parts.push("Vergiss nicht, danach die JSON-Datei zu erstellen und ins Repository zu laden.");
    window.alert(parts.join("\n"));
  } catch {
    window.alert("Die Ergebnisse konnten nicht geladen werden. Bitte prüfe deine Internetverbindung und versuche es erneut.");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function downloadState() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tippspiel-state.json";
  link.click();
  URL.revokeObjectURL(url);
}

els.importData.addEventListener("change", async () => {
  if (!IS_ADMIN || !els.importData.files.length) return;
  try {
    const imported = JSON.parse(await els.importData.files[0].text());
    if (imported.type === SUBMISSION_FILE_TYPE) {
      importSubmission(imported);
    } else {
      state = mergeState(imported);
    }
    render();
  } catch {
    window.alert("Die JSON-Datei konnte nicht gelesen werden.");
  } finally {
    els.importData.value = "";
  }
});

els.downloadSubmission.addEventListener("click", () => {
  const name = els.submitPlayerName.value.trim();
  if (!name) {
    window.alert("Bitte gib zuerst deinen Namen ein.");
    return;
  }

  submission.name = name;
  syncSubmissionDerivedPredictions();
  saveSubmission();

  const payload = {
    type: SUBMISSION_FILE_TYPE,
    exportedAt: new Date().toISOString(),
    player: {
      id: submission.id,
      name: submission.name,
    },
    prediction: {
      matches: submission.matches,
      groupWinners: submission.groupWinners,
      stages: sanitizeStages(submission.stages),
    },
  };

  downloadJson(payload, `wm-2026-tipp-${slugify(name)}.json`);
});

function importSubmission(file) {
  const player = file.player;
  const prediction = file.prediction;
  if (!player?.id || !player?.name || !prediction) {
    throw new Error("Invalid submission file");
  }

  const existingById = state.players.find((item) => item.id === player.id);
  const playerId = existingById?.id || player.id;
  if (existingById) {
    existingById.name = player.name;
  } else {
    state.players.push({ id: playerId, name: uniquePlayerName(player.name) });
  }
  state.predictions[playerId] = {
    matches: prediction.matches || {},
    groupWinners: prediction.groupWinners || {},
    stages: prediction.stages || {},
  };
  state.activePlayerId = playerId;
}

function uniquePlayerName(name) {
  if (!state.players.some((player) => player.name === name)) return name;
  let counter = 2;
  while (state.players.some((player) => player.name === `${name} (${counter})`)) {
    counter += 1;
  }
  return `${name} (${counter})`;
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeStages(stages) {
  return Object.fromEntries(WORLD_CUP_DATA.stageMeta.map((stage) => [stage.id, (stages[stage.id] || []).filter(Boolean)]));
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "teilnehmer";
}

function switchTab(scope, tabName) {
  document.querySelectorAll(`#${scope}-tabs .tab`).forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset[`${scope}Tab`] === tabName);
  });
  ["matches", "groups", "stages"].forEach((name) => {
    document.querySelector(`#${scope}-${name}`).classList.toggle("is-active", name === tabName);
  });
}

function formatScore(score) {
  return hasScore(score) ? `${score.home}:${score.away}` : "-";
}

loadInitialState().then((loadedState) => {
  state = loadedState;
  render();
  activateViewFromHash();
});

window.addEventListener("hashchange", activateViewFromHash);
