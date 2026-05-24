"use client";

import React from "react";

interface Source {
  id: number;
  name: string;
  percent: number;
  type: string;
}

interface PlagiarismReportProps {
  title: string;
  similarityIndex: number;
  internetSources: number;
  publications: number;
  studentPapers: number;
  sources: Source[];
  onClose: () => void;
}

const TurnitinReport: React.FC<PlagiarismReportProps> = ({
  title,
  similarityIndex = 0,
  internetSources = 0,
  publications = 0,
  studentPapers = 0,
  sources = [],
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="border-b border-slate-300 pb-2 mb-6">
            <span className="text-red-600 text-[10px] font-bold uppercase tracking-wider">Originality Report</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-5xl font-light text-red-600">{similarityIndex}</span>
                <span className="text-xl font-light text-red-600 ml-1">%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Similarity Index</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-5xl font-light text-slate-800">{internetSources}</span>
                <span className="text-xl font-light text-slate-800 ml-1">%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Internet Sources</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-5xl font-light text-slate-800">{publications}</span>
                <span className="text-xl font-light text-slate-800 ml-1">%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Publications</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline text-red-600">
                <span className="text-5xl font-light">{studentPapers}</span>
                <span className="text-xl font-light ml-1">%</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Student Papers</span>
            </div>
          </div>

          {/* Primary Sources */}
          <div>
            <div className="border-b border-slate-300 pb-2 mb-4">
              <span className="text-red-600 text-[10px] font-bold uppercase tracking-wider">Primary Sources</span>
            </div>

            <div className="space-y-6">
              {sources.map((source, index) => (
                <div key={source.id} className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="flex gap-4">
                    <div 
                      className="w-8 h-8 flex items-center justify-center text-white font-bold rounded"
                      style={{ 
                        backgroundColor: index === 0 ? '#ff0000' : 
                                         index === 1 ? '#e600e6' : 
                                         index === 2 ? '#8000ff' : '#64748b' 
                      }}
                    >
                      {source.id}
                    </div>
                    <div>
                      <div className="text-red-600 font-medium leading-tight mb-1 hover:underline cursor-pointer">
                        {source.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {source.type}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-light text-slate-800">{source.percent}</span>
                    <span className="text-sm font-light text-slate-800 ml-0.5">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Footer */}
          <div className="mt-12 grid grid-cols-2 gap-8 text-[11px] text-slate-500 border-t border-slate-200 pt-4">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Exclude quotes</span>
                <span className="text-slate-800 font-semibold uppercase">On</span>
              </div>
              <div className="flex justify-between">
                <span>Exclude bibliography</span>
                <span className="text-slate-800 font-semibold uppercase">On</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Exclude matches</span>
                <span className="text-slate-800 font-semibold uppercase">{"< 3 words"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnitinReport;
