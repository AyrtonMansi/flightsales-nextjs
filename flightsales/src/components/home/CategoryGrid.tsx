import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const categories = [
  {
    id: 'piston-single',
    label: 'Piston Singles',
    count: '840+',
    description: 'Cessna, Piper, Cirrus & more',
    bg: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63?w=600&auto=format&fit=crop&q=60',
  },
  {
    id: 'helicopter-turbine',
    label: 'Helicopters',
    count: '120+',
    description: 'Robinson, Bell, Airbus',
    bg: 'https://images.unsplash.com/photo-1534481016308-0d3e21c40223?w=600&auto=format&fit=crop&q=60',
  },
  {
    id: 'turboprop',
    label: 'Turboprops',
    count: '95+',
    description: 'PC-12, King Air, Caravan',
    bg: 'https://images.unsplash.com/photo-1583396618422-0a26d81ef0e1?w=600&auto=format&fit=crop&q=60',
  },
  {
    id: 'jet-light',
    label: 'Business Jets',
    count: '60+',
    description: 'Light, mid & heavy jets',
    bg: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=60',
  },
  {
    id: 'warbird',
    label: 'Warbirds',
    count: '45+',
    description: 'Historic & vintage military',
    bg: 'https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=600&auto=format&fit=crop&q=60',
  },
  {
    id: 'light-sport',
    label: 'Light Sport',
    count: '320+',
    description: 'LSA, ultralight, sport aircraft',
    bg: 'https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=600&auto=format&fit=crop&q=60',
  },
]

export function CategoryGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">Explore</p>
            <h2 className="section-title">Browse by Category</h2>
          </div>
          <Link
            href="/search"
            className="hidden sm:flex items-center gap-2 text-sm text-brand hover:text-brand-light font-medium transition-colors"
          >
            View all listings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="group relative overflow-hidden rounded-xl aspect-[4/3]"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${cat.bg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-2">
                  {cat.count} listings
                </div>
                <h3 className="font-display text-xl text-white tracking-tight">{cat.label}</h3>
                <p className="text-sm text-white/70 mt-0.5">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
