export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  subdomain: string;
  subpath: string;
  techStack: string[];
  status: "live" | "wip" | "coming-soon";
  screenshotUrl?: string;
  accentColor?: string;
  order: number;
}

export type NewProject = Omit<ProjectItem, "id">;
