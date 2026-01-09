"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, BookOpen, GraduationCap, Languages } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LearningPage() {
    const router = useRouter();

    const modules = [
        {
            id: "english",
            name: "English Learning",
            description: "Master English communication skills through interactive scenarios.",
            icon: <Languages size={32} />,
            color: "from-blue-500 to-cyan-500",
            borderColor: "border-blue-500/50",
            shadowColor: "shadow-blue-500/20",
            available: true,
        },
        {
            id: "japanese",
            name: "Japanese Learning",
            description: "Learn Japanese characters, vocabulary, and conversation.",
            icon: <div className="text-2xl font-bold">あ</div>,
            color: "from-red-500 to-pink-500",
            borderColor: "border-red-500/50",
            shadowColor: "shadow-red-500/20",
            available: false,
        }
    ];

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-900 text-white overflow-auto">
            {/* Background Pattern */}
            <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20 pointer-events-none" />
            
            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/10">
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                    <MessageSquare size={18} />
                    <span>Back to Chat</span>
                </Link>
            </header>

            {/* Title */}
            <div className="relative z-10 text-center py-12">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                        LEARNING LAB
                    </span>
                </h1>
                <p className="mt-4 text-slate-400 text-lg">Train your Agent in language and reasoning tasks</p>
                
                <div className="mt-8 flex items-center justify-center gap-4">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                    <GraduationCap className="text-indigo-400" size={32} />
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                </div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module) => (
                        <div 
                            key={module.id}
                            className={`
                                relative group cursor-pointer transition-all duration-300
                                ${module.available ? 'hover:scale-105 hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'}
                            `}
                            onClick={() => module.available && router.push(`/learning/${module.id}`)}
                        >
                            <div className={`absolute -inset-0.5 bg-gradient-to-r ${module.color} rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-500`} />
                            
                            <div className={`
                                relative bg-slate-900/90 rounded-xl border ${module.borderColor} 
                                p-6 flex flex-col h-full
                                ${module.shadowColor} shadow-lg backdrop-blur-sm
                            `}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} bg-opacity-10 text-white`}>
                                        {module.icon}
                                    </div>
                                    {!module.available && (
                                        <span className="px-2 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-400 border border-slate-700">
                                            Coming Soon
                                        </span>
                                    )}
                                </div>
                                
                                <h3 className="text-xl font-bold text-white mb-2">{module.name}</h3>
                                <p className="text-sm text-slate-400 mb-6 flex-1">{module.description}</p>
                                
                                <Button 
                                    className={`
                                        w-full bg-gradient-to-r ${module.color} text-white font-semibold
                                        hover:opacity-90 transition-opacity border-0
                                    `}
                                    disabled={!module.available}
                                >
                                    {module.available ? "Start Learning" : "In Development"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
