"use client";

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="md:hidden flex items-center">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-slate-900 p-2 focus:outline-none bg-white/50 rounded-lg shadow-sm border border-slate-200"
                aria-label="Toggle Menu"
                aria-expanded={isOpen}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {isOpen && (
                <div className="absolute top-[72px] left-0 right-0 bg-white/95 backdrop-blur-md shadow-2xl border-b border-slate-200 z-50 p-4 flex flex-col gap-2">
                    <a href="/" className="text-slate-700 font-bold py-3 px-4 hover:bg-[#F0B429]/10 hover:text-[#D99A1C] rounded-xl transition-colors">Compare Rates</a>
                    <a href="/calculators" className="text-slate-700 font-bold py-3 px-4 hover:bg-[#F0B429]/10 hover:text-[#D99A1C] rounded-xl transition-colors">Calculators</a>
                    <a href="/blog" className="text-slate-700 font-bold py-3 px-4 hover:bg-[#F0B429]/10 hover:text-[#D99A1C] rounded-xl transition-colors">Guides</a>
                    <div className="border-t border-slate-100 my-2 pt-4">
                        <a href="/alerts" className="block text-center bg-[#F0B429] text-slate-900 font-black px-5 py-3.5 rounded-xl shadow-md shadow-[#F0B429]/20 hover:bg-yellow-400 hover:-translate-y-1 transition-all">Set Rate Alert</a>
                    </div>
                </div>
            )}
        </div>
    );
}
