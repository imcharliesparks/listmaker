export type List = {
  id: number;
  title: string;
  description?: string | null;
  is_public?: boolean;
  cover_image?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const DEFAULT_LISTS: Array<Pick<List, "title" | "description">> = [
  {
    title: "Inspiration",
    description: "Ideas, references, and sparks to revisit.",
  },
  {
    title: "Reading Queue",
    description: "Articles and links to read or watch later.",
  },
  {
    title: "Wishlist",
    description: "Products or experiences to try next.",
  },
];
