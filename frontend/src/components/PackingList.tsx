import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Shirt, Sparkles, CheckSquare, Square, RefreshCw } from 'lucide-react';

interface PackingListProps {
  destination: string;
  weatherCondition?: string;
  interests?: string[];
}

interface Item {
  id: string;
  name: string;
  checked: boolean;
}

interface Category {
  name: string;
  icon: React.ReactNode;
  items: Item[];
}

export const PackingList: React.FC<PackingListProps> = ({
  destination,
  weatherCondition = 'Sunny',
  interests = [],
}) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Generate initial items based on context
    const basicDocs = [
      { id: 'doc-1', name: 'Passport & Visa copies', checked: false },
      { id: 'doc-2', name: 'Flight tickets & Lodging vouchers', checked: false },
      { id: 'doc-3', name: 'Foreign currency / credit cards', checked: false },
      { id: 'doc-4', name: 'Travel Insurance documents', checked: false },
    ];

    const basicElectronics = [
      { id: 'elec-1', name: 'Universal travel adapters', checked: false },
      { id: 'elec-2', name: 'Phone, laptop, and chargers', checked: false },
      { id: 'elec-3', name: 'High capacity power bank', checked: false },
      { id: 'elec-4', name: 'Noise-canceling headphones', checked: false },
    ];

    const basicToiletries = [
      { id: 'toil-1', name: 'Toothbrush & toothpaste', checked: false },
      { id: 'toil-2', name: 'Moisturizer & lip balm', checked: false },
      { id: 'toil-3', name: 'Hand sanitizer & wet wipes', checked: false },
      { id: 'toil-4', name: 'First-aid kit & basic meds', checked: false },
    ];

    const clothing = [
      { id: 'cloth-1', name: 'Breathable shirts / t-shirts', checked: false },
      { id: 'cloth-2', name: 'Lightweight pants / shorts', checked: false },
      { id: 'cloth-3', name: 'Comfortable walking shoes', checked: false },
      { id: 'cloth-4', name: 'Undergarments & socks', checked: false },
    ];

    // Adaptive Items
    const adaptiveItems = [];
    
    // Weather-based adaptive
    const cond = weatherCondition.toLowerCase();
    if (cond.includes('rain') || cond.includes('monsoon') || cond.includes('thunderstorm')) {
      adaptiveItems.push({ id: 'adapt-w1', name: 'Rain jacket or poncho', checked: false });
      adaptiveItems.push({ id: 'adapt-w2', name: 'Waterproof sandals / boots', checked: false });
      adaptiveItems.push({ id: 'adapt-w3', name: 'Compact travel umbrella', checked: false });
      adaptiveItems.push({ id: 'adapt-w4', name: 'Dry bags for electronics', checked: false });
    } else if (cond.includes('snow') || cond.includes('winter') || cond.includes('cold') || cond.includes('chilly')) {
      adaptiveItems.push({ id: 'adapt-w5', name: 'Thermal base layers', checked: false });
      adaptiveItems.push({ id: 'adapt-w6', name: 'Heavy winter coat / parka', checked: false });
      adaptiveItems.push({ id: 'adapt-w7', name: 'Woolen gloves, scarf, & beanie', checked: false });
      adaptiveItems.push({ id: 'adapt-w8', name: 'Lip balm & heavy moisturizer', checked: false });
    } else { // Sunny / Warm
      adaptiveItems.push({ id: 'adapt-w9', name: 'High SPF sunscreen', checked: false });
      adaptiveItems.push({ id: 'adapt-w10', name: 'UV sunglasses', checked: false });
      adaptiveItems.push({ id: 'adapt-w11', name: 'Sun protection hat / cap', checked: false });
    }

    // Interest-based adaptive
    const lowerInterests = interests.map(i => i.toLowerCase());
    if (lowerInterests.includes('beaches') || lowerInterests.includes('beach')) {
      adaptiveItems.push({ id: 'adapt-i1', name: 'Swimwear / board shorts', checked: false });
      adaptiveItems.push({ id: 'adapt-i2', name: 'Quick-dry travel towel', checked: false });
      adaptiveItems.push({ id: 'adapt-i3', name: 'Beach bag & flip flops', checked: false });
    }
    if (lowerInterests.includes('adventure') || lowerInterests.includes('nature') || lowerInterests.includes('trekking')) {
      adaptiveItems.push({ id: 'adapt-i4', name: 'Sturdy hiking boots', checked: false });
      adaptiveItems.push({ id: 'adapt-i5', name: 'Insect & mosquito repellent', checked: false });
      adaptiveItems.push({ id: 'adapt-i6', name: 'Hydration flask / water pack', checked: false });
    }
    if (lowerInterests.includes('culture') || lowerInterests.includes('history')) {
      adaptiveItems.push({ id: 'adapt-i7', name: 'Modest clothing for temples/churches', checked: false });
      adaptiveItems.push({ id: 'adapt-i8', name: 'Slip-on shoes for quick removal', checked: false });
    }

    setCategories([
      { name: 'Documents & Cards', icon: <Shield className="w-4 h-4 text-emerald-500" />, items: basicDocs },
      { name: 'Clothing & Footwear', icon: <Shirt className="w-4 h-4 text-sky-500" />, items: clothing },
      { name: 'Electronics & Gear', icon: <Smartphone className="w-4 h-4 text-purple-500" />, items: basicElectronics },
      { name: 'Toiletries & Health', icon: <Sparkles className="w-4 h-4 text-pink-500" />, items: basicToiletries },
      { name: 'Weather & Travel Adaptations', icon: <RefreshCw className="w-4 h-4 text-coral" />, items: adaptiveItems },
    ]);
  }, [destination, weatherCondition, interests]);

  const handleToggle = (catIdx: number, itemIdx: number) => {
    setCategories(prev => {
      const copy = [...prev];
      const itemsCopy = [...copy[catIdx].items];
      itemsCopy[itemIdx] = {
        ...itemsCopy[itemIdx],
        checked: !itemsCopy[itemIdx].checked
      };
      copy[catIdx] = {
        ...copy[catIdx],
        items: itemsCopy
      };
      return copy;
    });
  };

  const getProgress = (cat: Category) => {
    if (cat.items.length === 0) return 0;
    const checked = cat.items.filter(i => i.checked).length;
    return Math.round((checked / cat.items.length) * 100);
  };

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-sm)] space-y-8">
      <div className="border-b border-[var(--color-border-subtle)] pb-6 text-left">
        <h4 className="font-sans font-semibold text-lg text-[var(--color-text-primary)]">
          🧳 Smart Packing Assistant
        </h4>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Activity and weather adaptive checklist compiled for your trip to {destination}.
        </p>
      </div>

      <div className="space-y-10 max-h-[550px] overflow-y-auto pr-3 text-left">
        {categories.map((cat, catIdx) => {
          if (cat.items.length === 0) return null;
          const prog = getProgress(cat);
          
          return (
            <div key={catIdx} className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-bg-hover)] border border-[var(--color-border)] text-[var(--color-primary)]">
                    {cat.icon}
                  </div>
                  <span className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                    {cat.name}
                  </span>
                </div>
                <span className="text-[var(--text-xs)] font-mono font-bold text-[var(--color-primary)]">
                  {prog}%
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)] transition-all duration-300 ease-out" 
                  style={{ width: `${prog}%` }}
                />
              </div>

              {/* Items List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {cat.items.map((item, itemIdx) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggle(catIdx, itemIdx)}
                    className={`flex items-center gap-4 p-3.5 rounded-[var(--radius-md)] border transition-all text-left ${
                      item.checked 
                        ? 'bg-[var(--color-bg-active)] border-[var(--color-primary)]/20' 
                        : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <span className={`shrink-0 ${item.checked ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                      {item.checked ? (
                        <CheckSquare className="w-5 h-5 fill-[var(--color-primary)]/5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </span>
                    <span className={`text-[13px] font-medium ${item.checked ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PackingList;
