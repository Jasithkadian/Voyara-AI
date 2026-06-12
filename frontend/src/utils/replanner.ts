import { TripPlan, DailyPlan } from '../services/api';

export function simulateReplanLocal(originalPlan: TripPlan, changes: string): TripPlan {
  const query = changes.toLowerCase();
  
  // Deep copy original plan
  const newPlan: TripPlan = JSON.parse(JSON.stringify(originalPlan));
  
  // 1. Target specific Day parsing
  let targetDay = 0;
  const dayMatch = query.match(/day\s*(\d+)/);
  if (dayMatch && dayMatch[1]) {
    targetDay = parseInt(dayMatch[1], 10);
  }

  // 2. Adventure modifications
  if (query.includes('adventure') || query.includes('thrill') || query.includes('sport')) {
    newPlan.dailyItinerary = newPlan.dailyItinerary.map((day) => {
      if (targetDay > 0 && day.day !== targetDay) return day;

      const updated = { ...day };
      updated.activities = updated.activities.map((act) => {
        if (act.time === 'Afternoon') {
          return {
            ...act,
            title: 'High-Adrenaline Jet Ski & Parasailing Adventure',
            description: 'Experience high speeds on water scooters and take off in a parasail above scenic coastlines.',
            estimatedCost: 1500,
            duration: '2 hours',
            location: 'Adventure Beach Hub'
          };
        }
        return act;
      });
      return updated;
    });
    newPlan.travelTips = [...(newPlan.travelTips || []), 'Note: Day ' + (targetDay > 0 ? targetDay : 'activities') + ' upgraded with adventure activities.'];
  }

  // 3. Nightlife modifications
  else if (query.includes('nightlife') || query.includes('party') || query.includes('club')) {
    newPlan.dailyItinerary = newPlan.dailyItinerary.map((day) => {
      if (targetDay > 0 && day.day !== targetDay) return day;

      const updated = { ...day };
      updated.activities = updated.activities.map((act) => {
        if (act.time === 'Evening') {
          return {
            ...act,
            title: 'Nightclub Crawl & Cocktail Tasting',
            description: 'Visit top-rated local pubs and lounge dance floors with simulated guest list entry.',
            estimatedCost: 2000,
            duration: '4 hours',
            location: 'Tito\'s Lane Club District'
          };
        }
        return act;
      });
      return updated;
    });
  }

  // 4. Budget reductions
  else if (query.includes('reduce') || query.includes('cheaper') || query.includes('budget') || query.includes('cost')) {
    // Scale down all costs
    if (newPlan.budgetBreakdown) {
      const bd = newPlan.budgetBreakdown;
      bd.hotel_cost = Math.round(bd.hotel_cost * 0.75);
      bd.food_cost = Math.round(bd.food_cost * 0.75);
      bd.transportation_cost = Math.round(bd.transportation_cost * 0.8);
      bd.activity_cost = Math.round(bd.activity_cost * 0.7);
      bd.miscellaneous_cost = Math.round(bd.miscellaneous_cost * 0.65);
      bd.total_cost = bd.hotel_cost + bd.food_cost + bd.transportation_cost + bd.activity_cost + bd.miscellaneous_cost;
    }

    newPlan.dailyItinerary = newPlan.dailyItinerary.map((day) => {
      const updated = { ...day };
      updated.activities = updated.activities.map((act) => ({
        ...act,
        estimatedCost: Math.round(act.estimatedCost * 0.7)
      }));
      updated.restaurants = updated.restaurants.map((rest) => ({
        ...rest,
        estimatedCost: Math.round(rest.estimatedCost * 0.75)
      }));
      return updated;
    });

    newPlan.hotelRecommendations = newPlan.hotelRecommendations.map((hotel) => ({
      ...hotel,
      name: hotel.name + ' (Budget Saver)',
      pricePerNight: '₹' + Math.round(parseInt(hotel.pricePerNight.replace(/[^\d]/g, ''), 10) * 0.75).toLocaleString()
    }));
  }

  // 5. Replace expensive restaurants
  else if (query.includes('restaurant') || query.includes('dining') || query.includes('food')) {
    newPlan.dailyItinerary = newPlan.dailyItinerary.map((day) => {
      if (targetDay > 0 && day.day !== targetDay) return day;

      const updated = { ...day };
      updated.restaurants = updated.restaurants.map((rest) => ({
        ...rest,
        name: 'Local Street Food Plaza',
        estimatedCost: 350,
        description: 'Highly rated local culinary market stalls serving authentic regional dishes.'
      }));
      return updated;
    });
  }

  // 6. Default fallback: regenerate a day with general interests
  else {
    newPlan.dailyItinerary = newPlan.dailyItinerary.map((day) => {
      if (targetDay > 0 && day.day !== targetDay) return day;
      
      const updated = { ...day };
      updated.activities = [
        { time: 'Morning', title: 'Curated Heritage Walk', description: 'Explore local historical landmarks and architectural sites.', estimatedCost: 0, duration: '2 hours', location: 'Historical Core' },
        { time: 'Afternoon', title: 'Local Craft Workshop', description: 'Engage with local artisans and try traditional pottery making.', estimatedCost: 500, duration: '3 hours', location: 'Craft Center' },
        { time: 'Evening', title: 'Relaxing Sunset Point Walk', description: 'Gather at the highest peak to watch the scenic sunset panorama.', estimatedCost: 0, duration: '1.5 hours', location: 'Sunset Hill' }
      ];
      return updated;
    });
  }

  // Re-calculate total activities cost in budget breakdown if applicable
  let totalActivityCost = 0;
  newPlan.dailyItinerary.forEach((day) => {
    day.activities.forEach((act) => {
      totalActivityCost += act.estimatedCost;
    });
  });
  if (newPlan.budgetBreakdown) {
    newPlan.budgetBreakdown.activity_cost = totalActivityCost;
    newPlan.budgetBreakdown.total_cost = 
      newPlan.budgetBreakdown.hotel_cost + 
      newPlan.budgetBreakdown.food_cost + 
      newPlan.budgetBreakdown.transportation_cost + 
      newPlan.budgetBreakdown.activity_cost + 
      newPlan.budgetBreakdown.miscellaneous_cost;
  }

  return newPlan;
}
