import React from 'react';

export default function UnboundLogo({ size = 28, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`shrink-0 ${className}`}
        >
            <defs>
                <linearGradient id="puseTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="puseBottomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f8fafc" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="puseCenterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
            </defs>

            {/* Base Outer Ring */}
            <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />

            {/* Top Hemisphere (Unbound Blue) */}
            <path d="M 6.4 50 A 44 44 0 0 1 93.6 50 Z" fill="url(#puseTopGrad)" />

            {/* Top Specular Arc Highlight */}
            <path d="M 16 38 A 38 38 0 0 1 84 38 A 44 44 0 0 0 16 38 Z" fill="#ffffff" fillOpacity="0.3" />

            {/* Bottom Hemisphere (Sleek Platinum/White) */}
            <path d="M 6.4 50 A 44 44 0 0 0 93.6 50 Z" fill="url(#puseBottomGrad)" />

            {/* Center Band */}
            <rect x="5.5" y="45" width="89" height="10" fill="#090d16" />

            {/* Center Button Ring */}
            <circle cx="50" cy="50" r="16" fill="#090d16" />
            <circle cx="50" cy="50" r="12" fill="#ffffff" />

            {/* Center Core (Cyan Glow) */}
            <circle cx="50" cy="50" r="8" fill="url(#puseCenterGrad)" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="47.5" cy="47.5" r="2.5" fill="#ffffff" fillOpacity="0.9" />
        </svg>
    );
}
