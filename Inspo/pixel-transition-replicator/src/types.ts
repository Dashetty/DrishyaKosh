export interface Award {
  year: string;
  headline: string;
  logo: string;
}

export interface Details {
  director: string;
  year: string;
  category: string;
}

export interface Film {
  id: number;
  title: string;
  eyebrow: string;
  image: string;
  award: Award;
  details: Details;
  reviews: string[];
  synopsis?: string;
}
