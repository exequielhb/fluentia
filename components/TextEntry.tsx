
import React, { useState } from 'react';
import { ArrowRight, Zap, History, Globe } from 'lucide-react';
import { VoiceOption, VOICE_OPTIONS } from '../types';

interface TextEntryProps {
  onSubmit: (text: string) => void;
  history: string[];
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  isDarkMode: boolean;
}

const PRESETS = [
  "The quick brown fox jumps over the lazy dog.",
  "Astronomy is the study of everything in the universe beyond Earth's atmosphere.",
  "Effective communication is the cornerstone of any healthy relationship."
];

const TextEntry: React.FC<TextEntryProps> = ({ onSubmit, history, selectedVoice, onVoiceChange, isDarkMode }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length > 5) {
      onSubmit(text);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-3xl shadow-xl border p-8 transition-colors`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" size={20} />
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>¿Listo para practicar?</h2>
          </div>

          <div className={`flex flex-wrap gap-2 p-1 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => onVoiceChange(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedVoice.id === v.id 
                  ? (isDarkMode ? "bg-slate-800 text-indigo-400 shadow-sm border border-indigo-900/50" : "bg-white text-indigo-600 shadow-sm border border-indigo-100")
                  : (isDarkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600")
                }`}
              >
                <span className={`px-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'} text-[10px]`}>
                  {v.accent}
                </span>
                {v.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <textarea
              className={`w-full h-48 p-6 text-lg rounded-3xl focus:ring-0 focus:border-indigo-400 transition-all placeholder:text-slate-500 resize-none shadow-inner border-2 ${
                isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-slate-200 focus:bg-slate-900' 
                : 'bg-slate-50 border-slate-100 text-slate-700 focus:bg-white'
              }`}
              placeholder="Pega o escribe el texto que quieres aprender a leer..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className={`absolute bottom-4 right-4 text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
              {text.length} caracteres
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-500 px-1">
                <History size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Tus Textos Recientes</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setText(h)}
                    className={`p-3 text-left text-xs font-medium border rounded-xl transition-all truncate ${
                      isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-indigo-500 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-500 px-1">
              <Globe size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">Ejemplos Iniciales</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(p)}
                  className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                    isDarkMode 
                    ? 'bg-slate-700 text-slate-400 hover:bg-indigo-900 hover:text-indigo-400' 
                    : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  Ejemplo {i + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={text.trim().length <= 5}
            className={`w-full py-5 flex items-center justify-center gap-3 text-xl font-black rounded-3xl transition-all shadow-xl ${
              text.trim().length > 5 
              ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 shadow-indigo-500/20" 
              : (isDarkMode ? "bg-slate-700 text-slate-500 cursor-not-allowed" : "bg-slate-200 text-slate-400 cursor-not-allowed")
            }`}
          >
            Empezar Lección
            <ArrowRight size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TextEntry;
