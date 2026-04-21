export interface Campus {
  id: string;
  name: string;
  state: string;
}

/** Sample campuses; expand or replace with API later */
export const CAMPUSES: Campus[] = [
  { id: "harvard", name: "Harvard University", state: "MA" },
  { id: "mit", name: "Massachusetts Institute of Technology", state: "MA" },
  { id: "stanford", name: "Stanford University", state: "CA" },
  { id: "berkeley", name: "UC Berkeley", state: "CA" },
  { id: "ucla", name: "UCLA", state: "CA" },
  { id: "umich", name: "University of Michigan", state: "MI" },
  { id: "utexas", name: "University of Texas at Austin", state: "TX" },
  { id: "uiuc", name: "University of Illinois Urbana-Champaign", state: "IL" },
  { id: "gatech", name: "Georgia Institute of Technology", state: "GA" },
  { id: "uw", name: "University of Washington", state: "WA" },
  { id: "nyu", name: "New York University", state: "NY" },
  { id: "cornell", name: "Cornell University", state: "NY" },
  { id: "purdue", name: "Purdue University", state: "IN" },
  { id: "asu", name: "Arizona State University", state: "AZ" },
  { id: "uf", name: "University of Florida", state: "FL" },
];

export function campusLabel(id: string): string {
  const c = CAMPUSES.find((x) => x.id === id);
  return c ? `${c.name} (${c.state})` : "Not set";
}
