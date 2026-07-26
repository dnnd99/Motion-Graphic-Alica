import React, { useState } from 'react';
import { MotionTemplate, TemplateCategory } from '../types';
import { Search, Sparkles, Film, Tag, CheckCircle2 } from 'lucide-react';

interface TemplateSelectorProps {
  templates: MotionTemplate[];
  activeTemplateId: string;
  onSelectTemplate: (template: MotionTemplate) => void;
}

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'all', label: 'All Templates' },
  { id: 'backgrounds', label: 'Backgrounds' },
  { id: 'hud_vfx', label: 'HUD & Tech' },
  { id: 'abstract', label: 'Abstract & Waves' },
  { id: 'titles', label: 'Titles & Lower Thirds' },
  { id: 'loops', label: 'Retro & Loops' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  activeTemplateId,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="template-selector-panel" className="w-80 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-2 mb-3">
          <Film className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Microstock Templates
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-template"
            type="text"
            placeholder="Search motion graphics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="p-2 border-b border-slate-800 flex items-center space-x-1 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`btn-cat-${cat.id}`}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {filteredTemplates.map((template) => {
          const isActive = template.id === activeTemplateId;
          return (
            <div
              key={template.id}
              id={`template-card-${template.id}`}
              onClick={() => onSelectTemplate(template)}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <h3 className={`text-xs font-bold transition-colors ${isActive ? 'text-cyan-300' : 'text-slate-200 group-hover:text-cyan-400'}`}>
                  {template.name}
                </h3>
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-800/60 px-1.5 py-0.5 rounded">
                    {template.category}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                {template.description}
              </p>

              {/* Tags Preview */}
              <div className="flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800/80"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-xs">
            No templates matching "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
