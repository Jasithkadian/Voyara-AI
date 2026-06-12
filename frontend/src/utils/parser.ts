export interface ParsedTripParams {
  destination: string;
  days: number;
  budget: number;
  travelers: number;
  interests: string[];
  dates: string;
}

const INTEREST_KEYWORDS: Record<string, string[]> = {
  beaches: ['beach', 'beaches', 'sea', 'ocean', 'coast', 'coastal', 'seaside', 'sand', 'water'],
  nightlife: ['nightlife', 'party', 'parties', 'club', 'clubs', 'pub', 'pubs', 'bar', 'bars', 'night', 'disco', 'music', 'dance'],
  water_sports: ['water sports', 'surf', 'surfing', 'dive', 'diving', 'scuba', 'snorkel', 'snorkeling', 'swim', 'swimming'],
  food: ['food', 'dining', 'cuisine', 'restaurant', 'restaurants', 'eat', 'eating', 'culinary', 'gastronomy', 'local food', 'local dishes', 'cafe', 'cafes'],
  culture: ['culture', 'heritage', 'museum', 'museums', 'art', 'gallery', 'galleries', 'theatre', 'temple', 'temples', 'tradition', 'local life'],
  nature: ['nature', 'wildlife', 'jungle', 'forest', 'scenic', 'views', 'lake', 'lakes', 'mountain', 'mountains', 'landscape'],
  adventure: ['adventure', 'trek', 'trekking', 'hike', 'hiking', 'climb', 'climbing', 'rafting', 'paragliding', 'camp', 'camping', 'safari'],
  shopping: ['shop', 'shopping', 'market', 'markets', 'bazaar', 'mall', 'malls'],
  relaxation: ['relax', 'relaxation', 'spa', 'massage', 'wellness', 'yoga', 'peaceful', 'calm', 'resort', 'leisure'],
  history: ['history', 'historical', 'castle', 'castles', 'ruins', 'ancient', 'fort', 'forts', 'monument', 'monuments'],
};

export function parseNaturalLanguage(text: string): ParsedTripParams {
  const normalized = text.toLowerCase().trim();
  let remainingText = normalized;

  // 1. Extract Duration (Days)
  let days = 5;
  const daysMatch = remainingText.match(/(\d+)\s*(?:day|night|days|nights)/i);
  const weeksMatch = remainingText.match(/(\d+)\s*(?:week|weeks)/i);
  
  if (daysMatch && daysMatch[1]) {
    days = parseInt(daysMatch[1], 10);
    remainingText = remainingText.replace(daysMatch[0], ' ');
  } else if (weeksMatch && weeksMatch[1]) {
    days = parseInt(weeksMatch[1], 10) * 7;
    remainingText = remainingText.replace(weeksMatch[0], ' ');
  } else if (remainingText.includes('week')) {
    days = 7;
    remainingText = remainingText.replace(/\ba?\s*week\b/gi, ' ');
  }

  // 2. Extract Budget
  let budget = 30000;
  // Patterns like "under 20000", "budget 1.5 lakh", "under 20k", "within ₹15000", etc.
  const budgetRegex = /(?:under|below|budget|budget of|within|max|maximum|around|approx|for|costing|price of|upto|up to|₹|rs\.?|inr|usd|\$|€|euro|euros)?\s*(\d+(?:\.\d+)?)\s*(k|thousand|lakh|lakhs|lac|lacs|l|m|million)?\b/gi;
  
  let bestBudgetMatch: { matchedStr: string; val: number } | null = null;
  const budgetQualifiers = ['under', 'below', 'budget', 'within', 'max', 'around', 'approx', 'for', '₹', 'rs', 'inr', 'usd', '$', '€', 'k', 'thousand', 'lakh', 'lac', 'l'];
  
  const matches = [...normalized.matchAll(budgetRegex)];
  for (const m of matches) {
    const rawVal = m[1];
    let val = parseFloat(rawVal);
    const suffix = (m[2] || '').toLowerCase();
    
    if (suffix === 'k') {
      val *= 1000;
    } else if (suffix === 'thousand') {
      val *= 1000;
    } else if (suffix === 'lakh' || suffix === 'lakhs' || suffix === 'lac' || suffix === 'lacs' || suffix === 'l') {
      val *= 100000;
    } else if (suffix === 'm' || suffix === 'million') {
      val *= 1000000;
    }
    
    const isQualified = budgetQualifiers.some(q => m[0].includes(q));
    // Avoid double matching simple small numbers representing days or travelers unless qualified
    if (val >= 500 || isQualified) {
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
  const coupleKeywords = ['couple', 'honeymoon', 'partner', 'husband', 'wife', 'girlfriend', 'boyfriend', 'spouse', 'with my love', 'two of us'];
  const groupKeywords = ['family', 'group', 'friends', 'colleagues', 'co-workers', 'us', 'team', 'folks'];
  
  const travelersCountMatch = remainingText.match(/(\d+)\s*(?:traveler|travelers|guest|guests|people|person|persons|friend|friends|adult|adults|kid|kids|child|children)/i);
  
  if (travelersCountMatch && travelersCountMatch[1]) {
    travelers = parseInt(travelersCountMatch[1], 10);
    remainingText = remainingText.replace(travelersCountMatch[0], ' ');
  } else if (coupleKeywords.some(keyword => normalized.includes(keyword))) {
    travelers = 2;
  } else if (groupKeywords.some(keyword => normalized.includes(keyword))) {
    travelers = 4;
  } else if (normalized.includes('solo') || normalized.includes('myself') || normalized.includes(' me ')) {
    travelers = 1;
  }

  // 4. Extract Interests
  const interests: string[] = [];
  Object.entries(INTEREST_KEYWORDS).forEach(([category, keywords]) => {
    const matchesKeyword = keywords.some(keyword => normalized.includes(keyword));
    if (matchesKeyword) {
      interests.push(category);
    }
  });

  if (interests.length === 0) {
    interests.push('beaches');
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

  // 6. Extract Destination
  let destination = 'Goa';
  let destCandidate = remainingText
    .replace(/\b(?:trip|vacation|holiday|tour|travel|visit|go|explore|under|below|budget|within|max|for|with|people|person|travelers|guests|interested|in|to|and|couple|solo|family|group|days|weeks)\b/gi, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim();

  const prepositionMatch = text.match(/(?:to|visit|explore|in|for|at)\s+([A-Za-z\s\-]{3,20})(?:\s+under|\s+with|\s+for|\s+interested|,|\.|$)/i);
  if (prepositionMatch && prepositionMatch[1]) {
    const extracted = prepositionMatch[1].trim();
    const stopWords = ['trip', 'vacation', 'holiday', 'tour', 'travel', 'couple', 'solo', 'family', 'group', 'days', 'weeks', 'budget', 'beaches', 'nightlife'];
    if (!stopWords.includes(extracted.toLowerCase())) {
      destination = extracted;
    }
  } else {
    const commonDestinations = ['goa', 'bali', 'dubai', 'switzerland', 'japan', 'tokyo', 'delhi', 'mumbai', 'paris', 'london', 'new york', 'manali', 'maldives', 'singapore', 'thailand', 'bangkok'];
    let foundCommon = false;
    for (const city of commonDestinations) {
      if (normalized.includes(city)) {
        destination = city.charAt(0).toUpperCase() + city.slice(1);
        foundCommon = true;
        break;
      }
    }
    
    if (!foundCommon && destCandidate) {
      const tokens = destCandidate.split(/\s+/).filter(t => t.length > 2);
      if (tokens.length > 0) {
        destination = tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
      }
    }
  }

  return {
    destination: destination.charAt(0).toUpperCase() + destination.slice(1),
    days,
    budget,
    travelers,
    interests,
    dates,
  };
}
