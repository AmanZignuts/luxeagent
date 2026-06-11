import React from "react";
import { TESTIMONIALS } from "../constants";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3 h-3 ${
            star <= Math.round(rating) ? "text-amber-500" : "text-zinc-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-16 lg:py-20 bg-tint-champagne/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <p className="font-sans text-[9px] tracking-[0.3em] uppercase text-obsidian-velvet/40 mb-2">Client Stories</p>
          <h2 className="font-serif text-3xl font-light text-obsidian-velvet tracking-tight">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-surface-white border border-muted-zinc p-6 rounded-sm hover:border-obsidian-velvet/30 hover:shadow-sm transition-all duration-300"
              style={{ animation: `fadeSlideUp 0.6s ease ${i * 100}ms forwards`, opacity: 0 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-sans font-bold text-[10px] uppercase tracking-wider text-obsidian-velvet">
                    {t.name}
                  </p>
                  <p className="font-sans text-[8px] text-obsidian-velvet/40 mt-0.5">{t.date}</p>
                </div>
                <StarRating rating={t.rating} />
              </div>
              <p className="font-sans text-[10px] leading-relaxed text-obsidian-velvet/70">
                {t.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
