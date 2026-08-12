// Localisation hiérarchique : Région -> Commune/quartier (optionnel, pour affiner).
// Les 14 régions du Sénégal. Dakar & Thiès en tête (plus gros bassins d'utilisateurs).
export const REGIONS = [
  'Dakar', 'Thiès', 'Diourbel', 'Saint-Louis', 'Kaolack', 'Ziguinchor',
  'Louga', 'Fatick', 'Tambacounda', 'Kolda', 'Matam', 'Kaffrine', 'Kédougou', 'Sédhiou',
] as const;

// Communes / quartiers par région. Dakar est détaillé au quartier (précision utile en ville).
export const COMMUNES_BY_REGION: Record<string, string[]> = {
  'Dakar': [
    'Dakar-Plateau', 'Médina', 'Fann / Point E', 'Mermoz / Sacré-Cœur', 'Grand Dakar',
    'Liberté / HLM', 'Grand Yoff', 'Ouakam', 'Ngor', 'Almadies', 'Yoff', 'Ouest Foire',
    'Parcelles Assainies', 'Grand Médine', 'Patte d\'Oie', 'Hann / Bel-Air',
    'Pikine', 'Guédiawaye', 'Thiaroye', 'Keur Massar', 'Malika', 'Yeumbeul',
    'Rufisque', 'Bargny', 'Diamniadio', 'Sébikotane',
  ],
  'Thiès': ['Thiès', 'Mbour', 'Saly', 'Tivaouane', 'Joal-Fadiouth', 'Pout', 'Khombole', 'Mékhé', 'Nguékhokh'],
  'Diourbel': ['Diourbel', 'Touba', 'Mbacké', 'Bambey', 'Ndoulo'],
  'Saint-Louis': ['Saint-Louis', 'Richard-Toll', 'Dagana', 'Podor', 'Mpal', 'Ross Béthio'],
  'Kaolack': ['Kaolack', 'Guinguinéo', 'Nioro du Rip', 'Kahone', 'Ndoffane'],
  'Ziguinchor': ['Ziguinchor', 'Bignona', 'Oussouye', 'Cap Skirring', 'Thionck-Essyl'],
  'Louga': ['Louga', 'Kébémer', 'Linguère', 'Dahra'],
  'Fatick': ['Fatick', 'Foundiougne', 'Gossas', 'Sokone', 'Passy', 'Diofior'],
  'Tambacounda': ['Tambacounda', 'Bakel', 'Goudiry', 'Koumpentoum'],
  'Kolda': ['Kolda', 'Vélingara', 'Médina Yoro Foulah'],
  'Matam': ['Matam', 'Ourossogui', 'Kanel', 'Ranérou', 'Thilogne'],
  'Kaffrine': ['Kaffrine', 'Koungheul', 'Malem Hodar', 'Birkelane'],
  'Kédougou': ['Kédougou', 'Salémata', 'Saraya'],
  'Sédhiou': ['Sédhiou', 'Bounkiling', 'Goudomp'],
};

// Reverse lookup : commune -> région (pour retrouver la région d'une valeur existante).
export const REGION_OF_COMMUNE: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const [region, communes] of Object.entries(COMMUNES_BY_REGION)) {
    for (const c of communes) m[c] = region;
  }
  return m;
})();

// Renvoie la région d'une valeur (région elle-même, ou commune connue, sinon la valeur brute).
export function regionOf(value?: string | null): string | null {
  if (!value) return null;
  if ((REGIONS as readonly string[]).includes(value)) return value;
  return REGION_OF_COMMUNE[value] || value;
}
