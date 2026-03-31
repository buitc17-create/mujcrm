'use client';

import { useState } from 'react';
import { posts, categoryColors, calculateReadTime } from '../data/posts';

export default function BlogGrid() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(posts.map((p) => p.category)));
  const filtered = activeCategory ? posts.filter((p) => p.category === activeCategory) : posts;

  return (
    <>
      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        <button
          onClick={() => setActiveCategory(null)}
          className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            background: activeCategory === null ? 'rgba(0,191,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${activeCategory === null ? 'rgba(0,191,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: activeCategory === null ? '#00BFFF' : 'rgba(237,237,237,0.55)',
          }}
        >
          Vše ({posts.length})
        </button>
        {categories.map((cat) => {
          const color = categoryColors[cat] ?? '#00BFFF';
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? null : cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: isActive ? color + '18' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? color + '50' : 'rgba(255,255,255,0.1)'}`,
                color: isActive ? color : 'rgba(237,237,237,0.55)',
              }}
            >
              {cat} ({posts.filter((p) => p.category === cat).length})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((post) => {
          const catColor = categoryColors[post.category] ?? '#00BFFF';
          const readTime = calculateReadTime(post.content);
          return (
            <article
              key={post.slug}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Thumbnail */}
              <div
                className="h-44 flex items-center justify-center relative overflow-hidden"
                style={{ background: post.gradient }}
              >
                <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.15)' }} />
                <span
                  className="relative font-black opacity-20 select-none"
                  style={{ color: 'white', fontSize: '80px' }}
                >
                  {post.title.charAt(0)}
                </span>
                <span
                  className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.4)', color: 'white', backdropFilter: 'blur(8px)' }}
                >
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6">
                <h2 className="text-base font-bold text-white leading-snug mb-3 flex-1">
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(237,237,237,0.5)' }}>
                  {post.perex}
                </p>
                <div className="flex items-center gap-3 text-xs mb-5" style={{ color: 'rgba(237,237,237,0.35)' }}>
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{readTime} min čtení</span>
                </div>
                <a
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto"
                  style={{ color: catColor }}
                >
                  Číst více →
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-16 text-sm" style={{ color: 'rgba(237,237,237,0.4)' }}>
          Žádné články v této kategorii.
        </p>
      )}
    </>
  );
}
