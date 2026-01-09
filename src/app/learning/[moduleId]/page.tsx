"use client";

import React from 'react';
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Languages } from "lucide-react";
import { EnglishLearningModule } from '@/components/features/learning/english';

export default function LearningModulePage() {
    const params = useParams();
    const router = useRouter();
    const moduleId = params.moduleId as string;

    const moduleName = moduleId === 'english' ? 'English Learning' : 
                       moduleId === 'japanese' ? 'Japanese Learning' : 
                       'Unknown Module';

    return (
        <div className="h-screen w-full bg-[#0f172a] text-white flex flex-col">
            {/* Header */}
            <header className="h-12 border-b border-white/10 bg-slate-900/80 flex items-center px-4 justify-between shrink-0 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.push('/learning')}
                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">Learning Lab</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-sm font-semibold text-white">{moduleName}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {moduleId === 'english' ? (
                    <EnglishLearningModule />
                ) : (
                    <main className="h-full flex items-center justify-center p-6 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]">
                        <div className="max-w-md w-full text-center space-y-6">
                            <div className="w-24 h-24 mx-auto rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 border-dashed animate-pulse">
                                <Languages size={48} className="text-slate-500" />
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">Module Under Construction</h2>
                                <p className="text-slate-400">
                                    The {moduleName} environment is currently being built. 
                                    Check back soon for interactive learning scenarios.
                                </p>
                            </div>

                            <Button onClick={() => router.push('/learning')} variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                                Return to Hub
                            </Button>
                        </div>
                    </main>
                )}
            </div>
        </div>
    );
}
