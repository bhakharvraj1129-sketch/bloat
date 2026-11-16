// Fixed keyword list that maps an ingredient name to one of the 12 food groups (plan A11, A12).
// The server always derives the group here; a group sent by the client or the AI is never trusted.
const LIST: Array<[string, string[]]> = [
  ["TAG-01", ["milk", "ice cream", "yogurt", "yoghurt", "curd", "dahi", "soft cheese", "cheese", "cream", "paneer", "lassi", "latte", "cappuccino", "milkshake", "kheer", "raita", "butter milk", "buttermilk", "chaas", "custard", "whey", "condensed milk", "khoa", "mawa", "malai", "sour cream", "queso", "mozzarella", "ricotta"]],
  ["TAG-02", ["wheat", "whole-wheat", "bread", "bran", "rye", "pasta", "roti", "chapati", "naan", "paratha", "puri", "bhatura", "tortilla", "flour", "noodle", "spaghetti", "couscous", "barley", "pizza base", "pizza crust", "bun", "pav", "bagel", "cracker", "cereal", "semolina", "suji", "rava", "maida", "atta", "seitan", "wrap", "pita", "dumpling wrapper", "breadcrumb"]],
  ["TAG-03", ["onion", "garlic", "shallot", "leek", "scallion", "spring onion", "onion powder", "garlic powder"]],
  ["TAG-04", ["bean", "rajma", "chickpea", "chole", "chana", "hummus", "lentil", "dal", "daal", "dhal", "soy", "tofu", "edamame", "pea", "moong", "urad", "toor", "besan", "gram flour", "sprouts", "falafel", "sambar", "tempeh"]],
  ["TAG-05", ["apple", "pear", "peach", "mango", "honey", "fruit juice", "juice", "high-fructose", "corn syrup", "agave", "watermelon", "cherry", "dried fruit", "raisin", "date"]],
  ["TAG-06", ["sorbitol", "mannitol", "xylitol", "erythritol", "maltitol", "sugar-free", "sugar free", "sugar alcohol", "sugarless", "diet candy", "protein bar"]],
  ["TAG-07", ["fries", "fried", "deep-fried", "pizza", "creamy sauce", "pastry", "pastries", "samosa", "pakora", "bhaji", "bhajia", "vada", "ghee", "butter", "bacon", "sausage", "burger patty", "mayonnaise", "mayo", "chips", "crisps", "puri", "tempura", "doughnut", "donut", "sev", "farsan", "nugget", "wings"]],
  ["TAG-08", ["hot sauce", "chilli", "chili", "chile", "jalapeño", "jalapeno", "spicy", "pickle", "achar", "sriracha", "cayenne", "habanero", "schezwan", "szechuan", "salsa", "wasabi", "peri peri", "red pepper flakes", "green chilli"]],
  ["TAG-09", ["soda", "sparkling water", "sparkling", "energy drink", "beer", "cola", "fizzy", "carbonated", "tonic", "seltzer", "soft drink", "club soda", "kombucha"]],
  ["TAG-10", ["broccoli", "cauliflower", "gobi", "cabbage", "kale", "collard", "brussels sprout", "bok choy", "coleslaw", "sauerkraut", "kimchi", "radish"]],
  ["TAG-11", ["coffee", "tea", "chai", "energy drink", "cola", "espresso", "latte", "cappuccino", "matcha", "caffeine"]],
  ["TAG-12", ["beer", "wine", "spirits", "cocktail", "whisky", "whiskey", "vodka", "rum", "gin", "tequila", "alcohol", "sake", "cider", "champagne", "liqueur"]],
];

function hit(text: string, keyword: string): boolean {
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${esc}(s|es)?($|[^a-z])`, "i").test(text);
}

/** All food groups an ingredient name belongs to. Empty = "other". */
export function groupsFor(name: string): string[] {
  const text = name.toLowerCase().normalize("NFKC");
  // "tea" must not match inside "steak"; word boundaries above handle it. Peanut is not a pea.
  return LIST.filter(([, words]) => words.some((w) => hit(text, w))).map(([tag]) => tag);
}

/** The single group stored for an ingredient; an AI-proposed group is used only when the keywords agree. */
export function deriveGroup(name: string, proposed?: string): string {
  const groups = groupsFor(name);
  if (proposed && groups.includes(proposed)) return proposed;
  return groups[0] ?? "other";
}
