import type { Reel, Video } from "@/types";

/* ---------------------------------------------------------------------------
   THE ARCHIVE — swap-ready for a CMS later: replace this array's source with
   a fetch and keep the Video shape. Order within a reel = running order.

   ⚠ PLACEHOLDER NOTES: every curatorNote below is a stand-in written to keep
   the frames legible during the build. Replace each with your own one-liner
   before shipping — they are the soul of the site.

   Verify all youtubeIds with: pnpm verify:videos  (never part of the build)
--------------------------------------------------------------------------- */

export const reels: Reel[] = [
  { slug: "reel-01", number: "01", title: "Design" },
  { slug: "reel-02", number: "02", title: "Music" },
  { slug: "reel-03", number: "03", title: "Cinema" },
];

export const videos: Video[] = [
  // ————— REEL 01 — DESIGN —————
  {
    id: "helvetica-trailer",
    youtubeId: "wkoX0pEwSCw",
    title: "Helvetica",
    creator: "Gary Hustwit",
    year: 2007,
    genre: "Documentary",
    reel: "reel-01",
    duration: "2:19",
    curatorNote: "The typeface that became the atmosphere we all breathe.",
    catalogNumber: "DK-001",
  },
  {
    id: "objectified-trailer",
    youtubeId: "S9E2D2PaIcI",
    title: "Objectified",
    creator: "Gary Hustwit",
    year: 2009,
    genre: "Documentary",
    reel: "reel-01",
    duration: "1:46",
    curatorNote: "Every object in your room was decided by someone.",
    catalogNumber: "DK-002",
  },
  {
    id: "paula-scher-ted",
    youtubeId: "atn22-bmTPU",
    title: "Great Design Is Serious, Not Solemn",
    creator: "Paula Scher",
    year: 2008,
    genre: "Talk",
    reel: "reel-01",
    duration: "21:30",
    curatorNote: "Serious work made with a grin — the whole craft in one talk.",
    catalogNumber: "DK-003",
  },

  // ————— REEL 02 — MUSIC —————
  {
    id: "take-on-me",
    youtubeId: "djV11Xbc914",
    title: "Take On Me",
    creator: "a-ha",
    year: 1985,
    genre: "Music Video",
    reel: "reel-02",
    duration: "3:53",
    curatorNote: "A pencil sketch that learned to dance.",
    catalogNumber: "DK-004",
  },
  {
    id: "sledgehammer",
    youtubeId: "OJWJE0x7T4Q",
    title: "Sledgehammer",
    creator: "Peter Gabriel",
    year: 1986,
    genre: "Music Video",
    reel: "reel-02",
    duration: "5:07",
    curatorNote: "Stop-motion as a love language.",
    catalogNumber: "DK-005",
  },
  {
    id: "thriller",
    youtubeId: "sOnqjkJTMaA",
    title: "Thriller",
    creator: "Michael Jackson",
    year: 1983,
    genre: "Music Video",
    reel: "reel-02",
    duration: "13:42",
    curatorNote: "The night the music video grew a screenplay.",
    catalogNumber: "DK-006",
  },

  // ————— REEL 03 — CINEMA —————
  {
    id: "kurosawa-composing",
    youtubeId: "doaQC-S8de8",
    title: "Kurosawa — Composing Movement",
    creator: "Every Frame a Painting",
    year: 2015,
    genre: "Video Essay",
    reel: "reel-03",
    duration: "8:29",
    curatorNote: "Where the camera stops is where the meaning starts.",
    catalogNumber: "DK-007",
  },
  {
    id: "keaton-gag",
    youtubeId: "UWEjxkkB8Xs",
    title: "Buster Keaton — The Art of the Gag",
    creator: "Every Frame a Painting",
    year: 2015,
    genre: "Video Essay",
    reel: "reel-03",
    duration: "8:17",
    curatorNote: "Stunts no insurer would approve today, done with a straight face.",
    catalogNumber: "DK-008",
  },
  {
    id: "editor-feel",
    youtubeId: "3Q3eITC01Fg",
    title: "How Does an Editor Think and Feel?",
    creator: "Every Frame a Painting",
    year: 2016,
    genre: "Video Essay",
    reel: "reel-03",
    duration: "9:25",
    curatorNote: "Editing is rhythm before it is technique.",
    catalogNumber: "DK-009",
  },
  {
    id: "shining-trailer",
    youtubeId: "S014oGZiSdI",
    title: "The Shining — Official Trailer",
    creator: "Stanley Kubrick",
    year: 1980,
    genre: "Trailer",
    reel: "reel-03",
    duration: "1:59",
    curatorNote: "An elevator of blood as a marketing strategy.",
    catalogNumber: "DK-010",
  },
];
