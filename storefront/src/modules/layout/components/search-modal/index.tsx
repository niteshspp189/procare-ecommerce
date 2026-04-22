"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type ProductResult = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
}

export default function SearchModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
      setResults([])
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const searchProducts = async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`,
        { method: "GET" }
      )
      if (res.ok) {
        const data = await res.json()
        setResults(data.products || [])
      }
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchProducts(val), 300)
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    startTransition(() => router.push(`/shop?q=${encodeURIComponent(query.trim())}`))
  }

  const handleSuggestionClick = (handle: string) => {
    setOpen(false)
    startTransition(() => router.push(`/products/${handle}`))
  }

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-full py-2 pl-3 pr-5 text-sm text-gray-400 transition-colors group w-[200px]"
        aria-label="Search products"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="flex-shrink-0">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <span className="text-[13px]">Search products...</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] flex items-start justify-center pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-xl mx-4 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <form onSubmit={handleSearch} className="flex items-center px-4 py-3 border-b border-gray-100 gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search for products..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-900 placeholder-gray-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className="bg-black text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                Search
              </button>
            </form>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading && (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                  Searching...
                </div>
              )}

              {!loading && query.trim() && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <p className="text-sm text-gray-500">No products found for &ldquo;{query}&rdquo;</p>
                  <button onClick={handleSearch} className="text-xs font-bold text-black underline">
                    Search in all products
                  </button>
                </div>
              )}

              {!loading && results.length > 0 && (
                <ul className="divide-y divide-gray-50">
                  {results.map((product) => (
                    <li key={product.id}>
                      <button
                        onClick={() => handleSuggestionClick(product.handle)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.thumbnail ? (
                            <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">View product →</p>
                        </div>
                      </button>
                    </li>
                  ))}
                  {query.trim() && (
                    <li>
                      <button
                        onClick={handleSearch}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-semibold text-black"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        See all results for &ldquo;{query}&rdquo;
                      </button>
                    </li>
                  )}
                </ul>
              )}

              {!loading && !query.trim() && (
                <div className="px-4 py-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Popular categories</p>
                  <div className="flex flex-wrap gap-2">
                    {["Shoe Care", "Insoles", "Foot Care", "Sneaker Cleaner", "Leather Conditioner"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuery(tag)
                          searchProducts(tag)
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
