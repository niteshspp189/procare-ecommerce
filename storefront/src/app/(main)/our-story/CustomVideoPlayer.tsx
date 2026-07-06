"use client"

import React, { useState } from "react"

export default function CustomVideoPlayer({ videoId }: { videoId: string }) {
    const [isPlaying, setIsPlaying] = useState(false)

    if (isPlaying) {
        return (
            <iframe 
                className="absolute top-0 left-0 w-full h-full rounded-3xl"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title="MV Shoecare corporate video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
            ></iframe>
        )
    }

    return (
        <div 
            className="absolute top-0 left-0 w-full h-full cursor-pointer group rounded-3xl overflow-hidden"
            onClick={() => setIsPlaying(true)}
        >
            <img 
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                alt="Video thumbnail" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/30 group-hover:bg-[#0bb799]/90 group-hover:border-[#0bb799] group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
