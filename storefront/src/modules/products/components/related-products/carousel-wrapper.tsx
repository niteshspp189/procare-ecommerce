"use client"

import React, { useRef, useState, useEffect } from "react"

export default function CarouselWrapper({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    // Auto-scroll logic matching "slide in auto mode"
    useEffect(() => {
        const timer = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    // Reset to start if at end
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
                } else {
                    scroll('right')
                }
            }
        }, 4000)

        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative group">
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-10 text-black border border-gray-100 hover:scale-110 transition-transform hidden group-hover:flex"
            >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-6 no-scrollbar pb-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center z-10 text-black border border-gray-100 hover:scale-110 transition-transform hidden group-hover:flex"
            >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    )
}
