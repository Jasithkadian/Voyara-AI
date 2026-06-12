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
    const dest = (newPlan.tripSummary?.destination || '').toLowerCase();
    newPlan.dailyItinerary = newPlan.dailyItinerary.map((day) => {
      if (targetDay > 0 && day.day !== targetDay) return day;
      
      const updated = { ...day };
      if (dest.includes('goa')) {
        updated.activities = [
          { time: 'Morning', title: 'Sunkissed Dolphin Watch Cruise', description: 'Early morning boat trip spotting dolphins in their natural habitat.', estimatedCost: 400, duration: '2 hours', location: 'Sinquerim Beach' },
          { time: 'Afternoon', title: 'Old Goa Heritage Walk & Church Tours', description: 'Guided walking tour through historic churches and UNESCO sites.', estimatedCost: 100, duration: '3 hours', location: 'Old Goa' },
          { time: 'Evening', title: 'Premium Beachside Seafood Barbecue', description: 'Enjoy a candlelight sunset seafood dinner right on the sand.', estimatedCost: 1500, duration: '3 hours', location: 'Calangute' }
        ];
      } else {
        updated.activities = [
          { time: 'Morning', title: 'Premium Local Cultural Sightseeing', description: 'Experience local heritage, arts, and historic architectures with a professional guide.', estimatedCost: 350, duration: '3 hours', location: 'Cultural Center' },
          { time: 'Afternoon', title: 'Artistic Craft Workshop & Gallery Tour', description: 'Interactive pottery, cooking, or local craft creation session.', estimatedCost: 600, duration: '2.5 hours', location: 'Artisan District' },
          { time: 'Evening', title: 'Scenic Sunset Skyline Dinner', description: 'Enjoy high-quality local dishes with stunning elevated views.', estimatedCost: 1400, duration: '3 hours', location: 'Skyline Lounge' }
        ];
      }
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
