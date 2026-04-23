import React from 'react';
import { Star, Award, Clock, Shield } from 'lucide-react';

const stats = [
  { id: 'stat-orders', value: '2,400+', label: 'Portraits Delivered', icon: Award },
  { id: 'stat-rating', value: '4.9 / 5', label: 'Average Rating', icon: Star },
  { id: 'stat-turnaround', value: '5–14 Days', label: 'Turnaround Time', icon: Clock },
  { id: 'stat-guarantee', value: '50-Day', label: 'Satisfaction Guarantee', icon: Shield },
];

export default function SocialProofBar() {
  return (
    <section className="bg-white border-y border-[hsl(var(--border))] py-8">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats?.map((stat) => (
            <div key={stat?.id} className="flex flex-col items-center text-center gap-1.5">
              <stat.icon size={20} className="text-[#C9A84C]" />
              <span className="font-display text-2xl font-600 text-[#2C1810] tabular-nums">
                {stat?.value}
              </span>
              <span className="font-body text-xs text-[#9C8878] font-500">
                {stat?.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}