import React from 'react';
import { CloudRain, Sun, Info } from 'lucide-react';

interface TravelTipsProps {
  destination: string;
  startDate?: string;
  endDate?: string;
}

export const TravelTips: React.FC<TravelTipsProps> = ({ destination, startDate, endDate }) => {
  // Determine relevant month(s) from dates
  const getMonthFromDateString = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date.getMonth(); // 0-11
  };

  const startMonth = getMonthFromDateString(startDate);
  const endMonth = getMonthFromDateString(endDate);
  
  // Destination and date range specific tip generation
  const getTips = () => {
    const dest = destination.toLowerCase();
    const tipsList: { type: 'warning' | 'info' | 'success'; title: string; text: string; icon: any }[] = [];

    // General tips based on destination
    if (dest.includes('goa')) {
      const isMonsoon = (startMonth !== null && startMonth >= 5 && startMonth <= 8) || 
                        (endMonth !== null && endMonth >= 5 && endMonth <= 8); // June to September
      if (isMonsoon) {
        tipsList.push({
          type: 'warning',
          title: 'Monsoon Alert (June–September)',
          text: 'Goa monsoon runs June–September — expect heavy downpours, rough seas, and closed beach shacks. Pack waterproof sandals, dry bags, and plan for cozy indoor days at cafes/spas.',
          icon: CloudRain
        });
      } else {
        tipsList.push({
          type: 'success',
          title: 'Peak Beach Season',
          text: "Enjoy Goa's pleasant winter weather. Shacks are fully operational, water sports are active, and sunset cruises are recommended. Book beach excursions in advance.",
          icon: Sun
        });
      }
      tipsList.push({
        type: 'info',
        title: 'Local Transport',
        text: "Car and scooter rentals are the most cost-effective way to get around. Ensure you carry a valid driver's license and wear a helmet.",
        icon: Info
      });
    } else if (dest.includes('tokyo') || dest.includes('japan')) {
      const isCherryBlossom = (startMonth === 2 || startMonth === 3 || endMonth === 2 || endMonth === 3); // March or April
      if (isCherryBlossom) {
        tipsList.push({
          type: 'warning',
          title: 'Peak Cherry Blossom Crowds',
          text: 'Late March to early April is Tokyo\'s peak Sakura season. Expect massive crowds in Ueno Park and Shinjuku Gyoen. Reserve popular restaurants and transport weeks in advance.',
          icon: Info
        });
      }
      tipsList.push({
        type: 'info',
        title: 'Suica/Pasmo Cards',
        text: 'Get a digital Suica or Pasmo card on your phone for seamless subway navigation and vending machine payments.',
        icon: Info
      });
    } else if (dest.includes('dubai')) {
      const isSummer = (startMonth !== null && startMonth >= 4 && startMonth <= 8) || 
                       (endMonth !== null && endMonth >= 4 && endMonth <= 8); // May to September
      if (isSummer) {
        tipsList.push({
          type: 'warning',
          title: 'Extreme Summer Heat Alert',
          text: 'Dubai summers (May–September) regularly exceed 40°C (104°F) with high humidity. Outdoor activities are heavily restricted. Stick to air-conditioned malls, indoor theme parks, and early morning/late evening transits.',
          icon: Sun
        });
      }
      tipsList.push({
        type: 'info',
        title: 'Dress Code & Culture',
        text: 'While Dubai is tourist-friendly, dress modestly in public spaces like malls and governmental buildings. Shoulders and knees should be covered.',
        icon: Info
      });
    } else if (dest.includes('bali')) {
      const isWetSeason = (startMonth !== null && (startMonth >= 10 || startMonth <= 2)) ||
                          (endMonth !== null && (endMonth >= 10 || endMonth <= 2)); // Nov to March
      if (isWetSeason) {
        tipsList.push({
          type: 'warning',
          title: 'Wet Season Advisory (Nov–March)',
          text: 'Bali wet season brings daily tropical showers and high humidity. While landscapes are lush and green, boat transfers to Gili or Nusa Penida can be rough or cancelled.',
          icon: CloudRain
        });
      }
      tipsList.push({
        type: 'info',
        title: 'Cash is King',
        text: 'While cards are accepted in major cafes and hotels in Seminyak/Ubud, carry local IDR cash for markets, local warungs, and taxi tips.',
        icon: Info
      });
    } else if (dest.includes('switzerland')) {
      const isWinter = (startMonth !== null && (startMonth >= 11 || startMonth <= 2)) ||
                        (endMonth !== null && (endMonth >= 11 || endMonth <= 2)); // Dec to March
      if (isWinter) {
        tipsList.push({
          type: 'info',
          title: 'Ski Season & Swiss Pass',
          text: 'Winter is peak ski season in the Alps. Purchase a Swiss Travel Pass for unlimited travel on trains, boats, and panoramic routes across Switzerland.',
          icon: Info
        });
      } else {
        tipsList.push({
          type: 'success',
          title: 'Alpine Hiking Season',
          text: 'Summer/Autumn offers pristine hiking trails. Make sure to check cable car operational schedules as some routes shut down briefly between seasons.',
          icon: Sun
        });
      }
    } else {
      // Generic tips
      tipsList.push({
        type: 'info',
        title: 'Universal Travel Tip',
        text: 'Always check local visa rules and print a copy of your travel insurance. Store offline Google Maps of the destination area before departing.',
        icon: Info
      });
    }

    return tipsList;
  };

  const tips = getTips();

  return (
    <div className="bg-warmWhite dark:bg-dark-card border border-stoneMuted dark:border-dark-border rounded-lg p-6 shadow-sm hover:shadow-card-hover transition-all space-y-4">
      <div>
        <h4 className="font-sans font-semibold text-base text-textPrimary dark:text-warmWhite flex items-center gap-2">
          voira Travel Tips
        </h4>
        <p className="text-xs text-textSecondary dark:text-dark-text-muted">
          Context-aware recommendations for {destination}.
        </p>
      </div>

      <div className="space-y-4">
        {tips.map((tip, idx) => {
          const Icon = tip.icon;
          const bgClass = tip.type === 'warning' 
            ? 'bg-warningAmber/10 border-warningAmber/30 text-warningAmber' 
            : tip.type === 'success' 
            ? 'bg-successSage/10 border-successSage/30 text-successSage' 
            : 'bg-primary/5 border-primary/20 text-primary';

          return (
            <div key={idx} className={`p-4 rounded-md border flex items-start gap-3 text-xs leading-relaxed ${bgClass}`}>
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-1">{tip.title}</span>
                <span className="text-textSecondary dark:text-dark-text-muted">{tip.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
