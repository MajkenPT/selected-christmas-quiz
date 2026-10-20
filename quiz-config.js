/* Quiz schedule and questions. Shared by the page (browser) and the API (Node), so edit dates here only.
   Times are Danish time (CET, +01:00 in December). Winners are drawn at 12:00 the day after the question. */
(function (root) {
  var config = [
    { id:"q1", no:1, name:"Oh Crumbs!", title:"How many peppernuts are in the jar?",
      hint:"Look at the jar at the station and write your guess.",
      prize:"Ceramics", winners:4, kind:"int", unit:"peppernuts", placeholder:"e.g. 1250", min:1, max:100000,
      /* TEMPORARY TEST WINDOW (October, CEST +02:00). Restore to 2026-12-02T08:00 / 2026-12-03T11:00 / 2026-12-03T12:00 (+01:00) before launch,
         and delete the test answers on /admin. */
      opens:"2026-10-20T08:00:00+02:00", closes:"2026-10-22T11:00:00+02:00", draw:"2026-10-22T12:00:00+02:00" },
    { id:"q2", no:2, name:"Weigh Too Merry", title:"Guess the weight of the package.",
      hint:"The prizes are in the package. Write the weight in kilos.",
      prize:"Wash bag with Woods products", prizeShort:"Wash bag", winners:4, kind:"kg", unit:"kg", placeholder:"e.g. 2.4", min:0.01, max:500,
      opens:"2026-12-09T08:00:00+01:00", closes:"2026-12-10T11:00:00+01:00", draw:"2026-12-10T12:00:00+01:00" },
    { id:"q3", no:3, name:"Elf & Seek", title:"How many elves are in the picture?",
      hint:"Find the big board at the station and count the elves.",
      prize:"Bubbles with logo", prizeShort:"Bubbles", winners:4, kind:"int", unit:"elves", placeholder:"e.g. 42", min:1, max:100000,
      opens:"2026-12-16T08:00:00+01:00", closes:"2026-12-17T11:00:00+01:00", draw:"2026-12-17T12:00:00+01:00" }
  ];
  if (typeof module !== "undefined" && module.exports) module.exports = config;
  else root.QUIZ_CONFIG = config;
})(typeof window !== "undefined" ? window : this);
