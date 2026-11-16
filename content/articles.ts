// Learn library (plan A16). The plan gives each article's outline and sources, not its full text.
// Until the owner approves written articles, the library shows the outline exactly as planned,
// clearly marked. An article is never published without sources.
import { z } from "zod";

export const articleSchema = z.strictObject({
  id: z.string(), version: z.string(), title: z.string().min(1), covers: z.string().min(1), sources: z.array(z.string().min(1)).min(1),
  category: z.enum(["Understanding bloating", "Food and drink", "Mind and body", "Doctors and tests", "Staying safe"]),
  added_in: z.string().optional(), never_pushed_by_cards: z.boolean().optional(), links_help_page: z.boolean().optional(),
});
export type Article = z.infer<typeof articleSchema>;

const a = (id: string, title: string, covers: string, sources: string[], category: Article["category"], extra: Partial<Article> = {}): Article =>
  ({ id, version: "outline-1", title, covers, sources, category, ...extra });

export const ARTICLES: Article[] = [
  a("why", "Why bloating happens", "Swallowed air, fermentation, constipation, sensitivity, cycle, medicines", ["AGA 2023", "NIDDK", "NHS"], "Understanding bloating"),
  a("bloating-vs-swelling", "Bloating vs visible swelling", "Pressure vs distension; why they differ", ["AGA 2023"], "Understanding bloating"),
  a("swallowed-air", "Swallowed air", "Eating speed, gum, straws, fizzy drinks, smoking", ["NIDDK"], "Food and drink"),
  a("gas-foods", "Foods that make gas", "The 12 groups; portion matters; no \"bad foods\"", ["NIDDK", "Monash"], "Food and drink"),
  a("constipation", "Constipation and bloating", "Fibre gradually, fluids, kiwifruit, massage; when to see a doctor. Some laxatives and insoluble fibre can make bloating worse.", ["BDA 2025", "NHS"], "Food and drink"),
  a("gut-brain", "The gut–brain link", "Stress and sensitivity; it's not \"all in your head\"", ["AGA 2023"], "Mind and body"),
  a("fodmaps", "What FODMAPs are", "Three phases; short and supervised; reintroduce", ["Monash"], "Food and drink"),
  a("supplements", "Probiotics and supplements: the evidence", "AGA: probiotics not recommended for bloating; lactase; peppermint oil for IBS; simeticone", ["AGA 2023", "ACG", "NIDDK"], "Doctors and tests"),
  a("therapies", "Therapies and tests your doctor may discuss", "Breath tests, coeliac tests, biofeedback, gut-directed therapies (not offered in Bloat); antibiotics such as rifaximin and constipation medicines as options doctors may discuss", ["AGA 2023", "European 2025"], "Doctors and tests"),
  a("doctor-visit", "Getting the most from a doctor visit", "Using the doctor PDF; questions to ask", ["Apple 1.4.1 reminder", "NHS"], "Doctors and tests"),
  a("warning-signs", "Warning signs explained", "The NHS list in plain words; links the help page", ["NHS"], "Staying safe", { added_in: "4.4", links_help_page: true }),
  a("medicines", "Medicines and bloating", "GLP-1, iron, opioids, fibre supplements, laxatives; before/after view", ["Novo Nordisk label", "Kaiser Permanente", "Cangemi & Lacy"], "Doctors and tests", { added_in: "4.4" }),
  a("periods-menopause", "Bloating, periods and menopause", "Hormone shifts, HRT, endometriosis note", ["NHS", "Newson Health"], "Understanding bloating", { added_in: "4.4" }),
  a("normal-gas", "When normal gas feels like too much", "Visceral sensitivity; belly-pushing-out reflex; belly breathing", ["Mayo Clinic", "Cangemi & Lacy", "AGA 2023"], "Mind and body", { added_in: "4.4" }),
  a("ed-recovery", "Bloating during eating-disorder recovery", "Common and usually eases; never pushed by cards", ["Centre for Clinical Interventions"], "Staying safe", { added_in: "4.4", never_pushed_by_cards: true }),
];
