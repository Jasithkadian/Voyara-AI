export interface ParsedTripParams {
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  interests: string[];
  dates: string;
}

const INTEREST_KEYWORDS: Record<string, string[]> = {
  beaches: ['beach', 'beaches', 'sea', 'ocean', 'coast', 'coastal', 'seaside', 'sand', 'water', 'shack', 'shacks'],
  nightlife: ['nightlife', 'party', 'parties', 'club', 'clubs', 'pub', 'pubs', 'bar', 'bars', 'night', 'disco', 'music', 'dance', 'dj', 'nightclubs', 'nightclub'],
  water_sports: ['water sports', 'surf', 'surfing', 'dive', 'diving', 'scuba', 'snorkel', 'snorkeling', 'swim', 'swimming', 'boat', 'boating', 'jetski', 'jet ski'],
  food: ['food', 'dining', 'cuisine', 'restaurant', 'restaurants', 'eat', 'eating', 'culinary', 'gastronomy', 'local food', 'local dishes', 'cafe', 'cafes', 'seafood', 'grill', 'bites'],
  culture: ['culture', 'heritage', 'museum', 'museums', 'art', 'gallery', 'galleries', 'theatre', 'temple', 'temples', 'tradition', 'local life', 'monastery', 'monasteries'],
  nature: ['nature', 'wildlife', 'jungle', 'forest', 'scenic', 'views', 'lake', 'lakes', 'mountain', 'mountains', 'landscape', 'waterfall', 'waterfalls'],
  adventure: ['adventure', 'trek', 'trekking', 'hike', 'hiking', 'climb', 'climbing', 'rafting', 'paragliding', 'camp', 'camping', 'safari', 'raft', 'zipline'],
  shopping: ['shop', 'shopping', 'market', 'markets', 'bazaar', 'mall', 'malls', 'bazaars', 'souvenir', 'souvenirs'],
  relaxation: ['relax', 'relaxation', 'spa', 'massage', 'wellness', 'yoga', 'peaceful', 'calm', 'resort', 'leisure', 'retreat'],
  history: ['history', 'historical', 'castle', 'castles', 'ruins', 'ancient', 'fort', 'forts', 'monument', 'monuments', 'archaeology', 'fortress'],
};

const POPULAR_DESTINATIONS = [
  'Goa', 'Bali', 'Dubai', 'Switzerland', 'Japan', 'Tokyo', 'Delhi', 'Mumbai', 'Paris', 'London', 'New York', 'Manali', 'Maldives', 'Singapore', 'Thailand', 'Bangkok'
];

// Simple Levenshtein distance for typo tolerance
function getEditDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  single: 1, couple: 2, double: 2, triple: 3
};

export function parseNaturalLanguage(text: string): ParsedTripParams {
  const normalized = text.toLowerCase().trim();
  let remainingText = normalized;

  // 1. Extract Duration (Days)
  let days = 5;
  // Match patterns like "5 days", "5day", "5 nights", "1 week", "two weeks", etc.
  const daysMatch = remainingText.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*-?\s*(?:day|night|days|nights|d\b)/i);
  const weeksMatch = remainingText.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*-?\s*(?:week|weeks|w\b)/i);

  if (daysMatch) {
    const rawVal = daysMatch[1];
    const parsedDays = parseInt(rawVal, 10);
    days = isNaN(parsedDays) ? (NUMBER_WORDS[rawVal] || 5) : parsedDays;
    remainingText = remainingText.replace(daysMatch[0], ' ');
  } else if (weeksMatch) {
    const rawVal = weeksMatch[1];
    const parsedWeeks = parseInt(rawVal, 10);
    const weeks = isNaN(parsedWeeks) ? (NUMBER_WORDS[rawVal] || 1) : parsedWeeks;
    days = weeks * 7;
    remainingText = remainingText.replace(weeksMatch[0], ' ');
  }

  // 2. Extract Budget with lakh / lac / k / thousand / etc. support
  let budget = 30000;
  // Support prefixes like rs., inr, ₹, $, usd, under, below, budget of, etc.
  // Support suffixes like k, lakh, lakhs, lac, lacs, l, m, million, thousand, thousands
  const budgetRegex = /(?:under|below|budget|budget of|within|max|maximum|around|approx|for|costing|price of|upto|up to|₹|rs\.?|inr|usd|\$|€|euro|euros)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|thousands|lakh|lakhs|lac|lacs|l|m|million)?\b/gi;
  
  let bestBudgetMatch: { matchedStr: string; val: number } | null = null;
  const budgetQualifiers = ['under', 'below', 'budget', 'within', 'max', 'around', 'approx', 'for', '₹', 'rs', 'inr', 'usd', '$', '€', 'k', 'thousand', 'lakh', 'lac', 'l'];

  const matches = [...normalized.matchAll(budgetRegex)];
  for (const m of matches) {
    const rawVal = m[1];
    let val = parseFloat(rawVal);
    const suffix = (m[2] || '').toLowerCase();

    if (suffix === 'k') {
      val *= 1000;
    } else if (suffix === 'thousand' || suffix === 'thousands') {
      val *= 1000;
    } else if (suffix === 'lakh' || suffix === 'lakhs' || suffix === 'lac' || suffix === 'lacs' || suffix === 'l') {
      val *= 100000;
    } else if (suffix === 'm' || suffix === 'million') {
      val *= 1000000;
    }

    const isQualified = budgetQualifiers.some(q => m[0].includes(q));
    // Check if the match is a budget (avoid matching day counts or traveler counts like "5" or "2")
    if (val >= 500 || suffix !== '' || isQualified) {
      if (!bestBudgetMatch || isQualified || val > bestBudgetMatch.val) {
        bestBudgetMatch = { matchedStr: m[0], val };
      }
    }
  }

  if (bestBudgetMatch) {
    budget = bestBudgetMatch.val;
    remainingText = remainingText.replace(bestBudgetMatch.matchedStr, ' ');
  }

  // 3. Extract Travelers
  let travelers = 1;
  const coupleKeywords = ['couple', 'honeymoon', 'partner', 'husband', 'wife', 'girlfriend', 'boyfriend', 'spouse', 'with my love', 'two of us', 'husband and wife'];
  const groupKeywords = ['family', 'group', 'friends', 'colleagues', 'co-workers', 'us', 'team', 'folks'];

  const travelersCountMatch = remainingText.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:traveler|travelers|guest|guests|people|person|persons|friend|friends|adult|adults|kid|kids|child|children)/i);

  if (travelersCountMatch) {
    const rawVal = travelersCountMatch[1];
    const parsedCount = parseInt(rawVal, 10);
    travelers = isNaN(parsedCount) ? (NUMBER_WORDS[rawVal] || 1) : parsedCount;
    remainingText = remainingText.replace(travelersCountMatch[0], ' ');
  } else if (coupleKeywords.some(keyword => normalized.includes(keyword))) {
    travelers = 2;
  } else if (groupKeywords.some(keyword => normalized.includes(keyword))) {
    travelers = 4;
  } else if (normalized.includes('solo') || normalized.includes('myself') || normalized.includes(' me ')) {
    travelers = 1;
  }

  // 4. Extract Interests/Moods
  const interests: string[] = [];
  Object.entries(INTEREST_KEYWORDS).forEach(([category, keywords]) => {
    const matchesKeyword = keywords.some(keyword => normalized.includes(keyword));
    if (matchesKeyword) {
      interests.push(category);
    }
  });

  if (interests.length === 0) {
    interests.push('beaches'); // Default fallback
  }

  // 5. Extract Dates
  let dates = 'Upcoming months';
  const monthRegex = /(?:in|for|at|during|around|end of|start of|middle of)\s*(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s+\d{4})?/i;
  const monthMatch = text.match(monthRegex);
  if (monthMatch && monthMatch[0]) {
    dates = monthMatch[0].trim();
    remainingText = remainingText.replace(monthMatch[0].toLowerCase(), ' ');
  } else if (normalized.includes('next week')) {
    dates = 'Next Week';
  } else if (normalized.includes('next month')) {
    dates = 'Next Month';
  } else if (normalized.includes('this weekend')) {
    dates = 'This Weekend';
  }

  // 6. Extract Destination with Typo Tolerance
  let destination = '';
  
  // Clean punctuation and double spaces
  const cleanRemaining = remainingText
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const words = cleanRemaining.split(/\s+/).filter(w => w.length >= 3);

  // Check known popular destinations for matches first, allowing up to 2 typos depending on word length
  for (const word of words) {
    for (const popDest of POPULAR_DESTINATIONS) {
      const distance = getEditDistance(word, popDest.toLowerCase());
      const maxAllowedDistance = popDest.length <= 4 ? 1 : 2;
      if (distance <= maxAllowedDistance) {
        destination = popDest;
        break;
      }
    }
    if (destination) break;
  }

  // If no known destination matched, try preposition extraction
  if (!destination) {
    const prepositionMatch = text.match(/(?:to|visit|explore|in|for|at)\s+([A-Za-z\s\-]{3,20})(?:\s+under|\s+with|\s+for|\s+interested|,|\.|$)/i);
    if (prepositionMatch && prepositionMatch[1]) {
      const extracted = prepositionMatch[1].trim();
      const stopWords = ['trip', 'vacation', 'holiday', 'tour', 'travel', 'couple', 'solo', 'family', 'group', 'days', 'weeks', 'budget', 'beaches', 'nightlife', 'people', 'guests'];
      if (!stopWords.includes(extracted.toLowerCase())) {
        destination = extracted;
      }
    }
  }

  // Default fallback if we still don't have anything
  if (!destination) {
    destination = 'Goa';
  }

  // Capitalize properly
  destination = destination.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    destination,
    days,
    budget,
    travelers,
    interests,
    dates,
  };
}
