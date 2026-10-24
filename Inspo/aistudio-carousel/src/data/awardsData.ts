export type DisciplineCategory = 
  | 'all' 
  | 'websites' 
  | 'architecture' 
  | 'branding' 
  | 'ecommerce';

export type PlatformFilter = 
  | 'all' 
  | 'awwwards' 
  | 'cssda' 
  | 'csswinner';

export interface Award {
  id: string;
  date: string;
  provider: 'CSS Winner' | 'CSS Design Awards' | 'Awwwards' | string;
  recognition: 'Star Award' | 'Special Kudos' | 'Site of the Day' | 'Honorable Mention' | string;
  url: string | null;
}

export interface AwardedProject {
  id: string;
  slugs: string[];
  title: string;
  image: string;
  category: DisciplineCategory;
  categoryLabel: string;
  awards: Award[];
}

export const allAwardedProjects: AwardedProject[] = [
  {
    id: "pakshoma",
    slugs: ["pakshoma", "پاکشوما"],
    title: "Pakshoma",
    image: "/assets/img/awards/projects/pakshoma.webp",
    category: "websites",
    categoryLabel: "Websites & Digital",
    awards: [
      {
        id: "2025-03-17-pakshoma-css-winner",
        date: "2025-03-17",
        provider: "CSS Winner",
        recognition: "Star Award",
        url: "https://www.csswinner.com/details/pakshoma/18552",
      },
      {
        id: "2025-03-06-pakshoma-css-design-awards",
        date: "2025-03-06",
        provider: "CSS Design Awards",
        recognition: "Special Kudos",
        url: "https://www.cssdesignawards.com/sites/pakshoma/47164",
      },
    ],
  },
  {
    id: "designex",
    slugs: ["designex", "designex-architectural-designer", "طراحی-معماری-دیزاین-ایکس"],
    title: "Designex Architecture Studio",
    image: "/assets/img/awards/projects/designex.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2025-01-22-designex-architecture-studio-css-design-awards",
        date: "2025-01-22",
        provider: "CSS Design Awards",
        recognition: "Special Kudos",
        url: "https://www.cssdesignawards.com/sites/designex-architecture-studio/46902",
      },
      {
        id: "2025-01-15-designex-architecture-studio-css-winner",
        date: "2025-01-15",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/designex-architecture-studio/18470",
      },
    ],
  },
  {
    id: "dorr",
    slugs: ["dorr", "dorr-architects", "دفتر-معماری-دُر"],
    title: "Dorr Architects",
    image: "/assets/img/awards/projects/dorr.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2024-09-20-dorr-architects-awwwards",
        date: "2024-09-20",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/dorr-architects",
      },
      {
        id: "2024-07-17-dorr-architects-css-winner",
        date: "2024-07-17",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/dorr-architects/18155",
      },
    ],
  },
  {
    id: "dokmeh-2024",
    slugs: ["dokmeh-2024", "dokmeh-creative-agency-2", "dokmeh-agency-2024"],
    title: "Dokmeh Agency 2024",
    image: "/assets/img/awards/projects/dokmeh-2024.webp",
    category: "branding",
    categoryLabel: "Branding & UI/UX",
    awards: [
      {
        id: "2024-09-11-dokmeh-creative-agency-awwwards",
        date: "2024-09-11",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/dokmeh-creative-agency-2",
      },
      {
        id: "2024-03-22-dokmeh-agency-css-design-awards",
        date: "2024-03-22",
        provider: "CSS Design Awards",
        recognition: "Special Kudos",
        url: "https://www.cssdesignawards.com/sites/dokmeh-agency-2024/45330",
      },
      {
        id: "2024-03-21-dokmeh-agency-css-winner",
        date: "2024-03-21",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/dokmeh-agency/17902",
      },
    ],
  },
  {
    id: "royal-jeans",
    slugs: ["royal-jeans", "رویال-جین"],
    title: "Royal Jeans Landing Page",
    image: "/assets/img/awards/projects/royal-jeans.webp",
    category: "ecommerce",
    categoryLabel: "E-commerce & Retail",
    awards: [
      {
        id: "2024-09-11-royal-jeans-landing-page-css-winner",
        date: "2024-09-11",
        provider: "CSS Winner",
        recognition: "Star Award",
        url: "https://www.csswinner.com/details/royal-jeans-landing-page/18250",
      },
    ],
  },
  {
    id: "design-kki",
    slugs: ["design-kki"],
    title: "Design KKi",
    image: "/assets/img/awards/projects/design-kki.webp",
    category: "branding",
    categoryLabel: "Branding & UI/UX",
    awards: [
      {
        id: "2022-09-28-design-kki-awwwards",
        date: "2022-09-28",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/design-kki",
      },
    ],
  },
  {
    id: "dokmeh-2022",
    slugs: ["dokmeh-2022", "dokmeh-agency"],
    title: "Dokmeh Agency 2022",
    image: "/assets/img/awards/projects/dokmeh-2022.webp",
    category: "branding",
    categoryLabel: "Branding & UI/UX",
    awards: [
      {
        id: "2022-09-15-dokmeh-agency-awwwards",
        date: "2022-09-15",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/dokmeh-agency",
      },
      {
        id: "2022-09-14-dokmeh-agency-css-design-awards",
        date: "2022-09-14",
        provider: "CSS Design Awards",
        recognition: "Special Kudos",
        url: "https://www.cssdesignawards.com/sites/dokmeh-agency/41984",
      },
    ],
  },
  {
    id: "paadiran",
    slugs: ["paadiran", "پادیران"],
    title: "Paadiran",
    image: "/assets/img/awards/projects/paadiran.webp",
    category: "ecommerce",
    categoryLabel: "E-commerce & Retail",
    awards: [
      {
        id: "2021-09-20-paadiran-css-winner",
        date: "2021-09-20",
        provider: "CSS Winner",
        recognition: "Star Award",
        url: "https://www.csswinner.com/details/paadiran/15649",
      },
    ],
  },
  {
    id: "khesht-o-khorshid",
    slugs: ["khesht-o-khorshid", "khesht-o-khorshid-architecture-studio", "پروژه-طراحی-سایت-خشت-و-خورشید"],
    title: "Khesht o Khorshid",
    image: "/assets/img/awards/projects/khesht-o-khorshid.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2021-09-07-khesht-o-khorshid-css-design-awards",
        date: "2021-09-07",
        provider: "CSS Design Awards",
        recognition: "Special Kudos",
        url: "https://www.cssdesignawards.com/sites/khesht-o-khorshid/47164",
      },
      {
        id: "2021-09-01-khesht-o-khorshid-css-winner",
        date: "2021-09-01",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/khesht-o-khorshid/15622",
      },
    ],
  },
  {
    id: "farho",
    slugs: ["farho", "farho-architects"],
    title: "Farho Architects",
    image: "/assets/img/awards/projects/farho.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2020-04-06-farho-architects-css-winner",
        date: "2020-04-06",
        provider: "CSS Winner",
        recognition: "Star Award",
        url: "https://www.csswinner.com/details/farho-architects/14389",
      },
    ],
  },
  {
    id: "shift",
    slugs: ["shift", "shift-process-practice-design-studio"],
    title: "Shift Process Practice",
    image: "/assets/img/awards/projects/shift.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2019-10-07-shift-process-practice-awwwards",
        date: "2019-10-07",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/shift-process-practice",
      },
    ],
  },
  {
    id: "masoud-rostami",
    slugs: ["masoud-rostami", "masoud-rostami-a-graphic-designer", "مسعود-رستمی-طراح-گرافیک"],
    title: "Masoud Rostami",
    image: "/assets/img/awards/projects/masoud-rostami.webp",
    category: "branding",
    categoryLabel: "Branding & UI/UX",
    awards: [
      {
        id: "2019-09-03-masoudrostami-official-website-awwwards",
        date: "2019-09-03",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/masoudrostami-official-website",
      },
      {
        id: "2018-09-24-masoud-rostami-css-winner",
        date: "2018-09-24",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/masoud-rostami/12994",
      },
    ],
  },
  {
    id: "cedrus",
    slugs: ["cedrus", "cedrus-architecture-studio", "معماری-سدوس"],
    title: "Cedrus Architects",
    image: "/assets/img/awards/projects/cedrus.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2019-07-23-cedrus-architects-css-winner",
        date: "2019-07-23",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/cedrus-architects/13753",
      },
    ],
  },
  {
    id: "z",
    slugs: ["z", "z-architecture-studio", "طراحی-وب-سایت-z"],
    title: "Z. Architecture",
    image: "/assets/img/awards/projects/z.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2019-07-16-z-awwwards",
        date: "2019-07-16",
        provider: "Awwwards",
        recognition: "Honorable Mention",
        url: "https://www.awwwards.com/sites/z-architecture",
      },
      {
        id: "2019-06-15-z-css-winner",
        date: "2019-06-15",
        provider: "CSS Winner",
        recognition: "Site of the Day",
        url: "https://www.csswinner.com/details/z/13650",
      },
    ],
  },
  {
    id: "tdc",
    slugs: ["tdc", "tdc-office"],
    title: "TDC Office",
    image: "/assets/img/awards/projects/tdc.webp",
    category: "websites",
    categoryLabel: "Websites & Digital",
    awards: [
      {
        id: "2017-06-16-tdc-office-css-winner",
        date: "2017-06-16",
        provider: "CSS Winner",
        recognition: "Star Award",
        url: "https://www.csswinner.com/details/tdc-office/11621",
      },
    ],
  },
  {
    id: "nextoffice",
    slugs: ["nextoffice", "nextoffice-architecture-studio", "دفتر-معماری-علیرضا-تغابنی"],
    title: "Nextoffice",
    image: "/assets/img/awards/projects/nextoffice.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2017-03-10-nextoffice-css-design-awards",
        date: "2017-03-10",
        provider: "CSS Design Awards",
        recognition: "Special Kudos",
        url: "http://www.cssdesignawards.com/sites/nextoffice/30216",
      },
    ],
  },
  {
    id: "rooydaad",
    slugs: ["rooydaad", "rooydaad-architecture-studio", "معماران-رویداد"],
    title: "Rooydaad Architects",
    image: "/assets/img/awards/projects/rooydaad.webp",
    category: "architecture",
    categoryLabel: "Architecture & Spaces",
    awards: [
      {
        id: "2017-02-22-rooydaad-architects-css-winner",
        date: "2017-02-22",
        provider: "CSS Winner",
        recognition: "Star Award",
        url: "https://www.csswinner.com/details/rooydaad-architects/11278",
      },
    ],
  },
];

// Helper to calculate stage scroll height dynamically based on project count
export const getAwardsScrollHeight = (projectCount: number) => {
  return `${Math.max(100, 100 + (projectCount - 1) * 60)}svh`;
};

// Legacy compatibility
export const featuredAwardedProjects = allAwardedProjects.slice(0, 10);
export const awardsScrollHeight = getAwardsScrollHeight(10);

export const disciplineCategories: { id: DisciplineCategory; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'websites', label: 'Websites & Digital' },
  { id: 'architecture', label: 'Architecture & Spaces' },
  { id: 'branding', label: 'Branding & UI/UX' },
  { id: 'ecommerce', label: 'E-commerce & Retail' },
];

export const platformCategories: { id: PlatformFilter; label: string }[] = [
  { id: 'all', label: 'All Honors' },
  { id: 'awwwards', label: 'Awwwards' },
  { id: 'cssda', label: 'CSS Design Awards' },
  { id: 'csswinner', label: 'CSS Winner' },
];
