
import React, { useState } from 'react';
import { 
  Trophy, 
  Lightbulb, 
  RotateCcw, 
  AlertCircle,
  Share2,
  CheckCircle2,
  BarChart3,
  Book,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ReadingFeedback } from '../types';

interface FeedbackDashboardProps {
  feedback: ReadingFeedback;
  text: string;
  onRetry: () => void;
  isDarkMode: boolean;
}

const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ feedback, text, onRetry, isDarkMode }) => {
  const [isShared, setIsShared] = useState(false);
  const scores = [
    { name: 'Pronunciación', value: feedback.pronunciationScore, color: '#4f46e5' },
    { name: 'Entonación', value: feedback.intonationScore, color: '#06b6d4' },
    { name: 'Fluidez', value: feedback.fluencyScore, color: '#8b5cf6' },
  ];

  const overallScore = Math.round((feedback.pronunciationScore + feedback.intonationScore + feedback.fluencyScore) / 3);

  const handleShare = async () => {
    const shareText = `¡He completado un texto de nivel ${feedback.difficultyLevel} con ${overallScore}% en FluentRead AI! 🎯 Tiempo: ${feedback.readingTimeSeconds}s.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Logro en FluentRead AI',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error al compartir:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setIsShared(true);
      setTimeout(() => setIsShared(false), 2000);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[40px] shadow-2xl p-8 md:p-10 border flex flex-col md:flex-row items-center gap-10 relative overflow-hidden transition-colors`}>
        {/* Decorative background */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-50 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'}`} />
        
        <div className="relative w-48 h-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              innerRadius="80%" 
              outerRadius="100%" 
              data={[{ value: overallScore }]} 
              startAngle={90} 
              endAngle={450}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar 
                background={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }} 
                dataKey="value" 
                cornerRadius={30} 
                fill="#4f46e5" 
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{overallScore}</span>
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Puntaje</span>
          </div>
        </div>

        <div className="flex-1 space-y-5 text-center md:text-left">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500">
              <Trophy size={20} fill="currentColor" />
              <span className="font-black uppercase tracking-[0.2em] text-xs">Sesión Completada</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              Nivel: {feedback.difficultyLevel}
            </span>
          </div>
          
          <h2 className={`text-3xl font-black leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Resultados del Análisis</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded-2xl border flex flex-col items-center md:items-start ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs uppercase font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tu Tiempo</span>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{feedback.readingTimeSeconds}s</span>
              </div>
            </div>
            <div className={`p-3 rounded-2xl border flex flex-col items-center md:items-start ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs uppercase font-bold mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Meta (200wpm)</span>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500" />
                <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{feedback.estimatedTimeSeconds}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[32px] shadow-xl p-8 border space-y-5 transition-colors`}>
          <div className="flex items-center gap-3 text-purple-500">
            <div className={`${isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'} p-2.5 rounded-xl`}>
              <Book size={24} />
            </div>
            <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Análisis del Texto</h3>
          </div>
          <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {feedback.grammarAnalysis}
          </p>
          <div className="flex flex-wrap gap-2">
            {scores.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-700'}`}>{s.name}: {s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[32px] shadow-xl p-8 border space-y-5 transition-colors`}>
          <div className="flex items-center gap-3 text-red-500">
            <div className={`${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'} p-2.5 rounded-xl`}>
              <AlertCircle size={24} />
            </div>
            <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Palabras Clave</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {feedback.mistakes.length > 0 ? (
              feedback.mistakes.map((word, i) => (
                <span key={i} className={`px-4 py-1.5 rounded-xl font-bold border text-sm transition-colors cursor-default ${
                  isDarkMode ? 'bg-slate-900 text-slate-300 border-slate-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  {word}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <CheckCircle2 size={16} />
                <span>¡Lectura fluida y sin errores!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'} rounded-[32px] shadow-xl p-8 border space-y-5 transition-colors`}>
        <div className="flex items-center gap-3 text-cyan-500">
          <div className={`${isDarkMode ? 'bg-cyan-900/20' : 'bg-cyan-50'} p-2.5 rounded-xl`}>
            <Lightbulb size={24} />
          </div>
          <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Consejos de Mejora</h3>
        </div>
        <ul className="space-y-4">
          {feedback.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={`mt-1 shrink-0 w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs border ${
                isDarkMode ? 'bg-cyan-900/30 text-cyan-400 border-cyan-900/50' : 'bg-cyan-50 text-cyan-600 border-cyan-100'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 pb-8">
        <button
          onClick={onRetry}
          className={`w-full md:w-auto px-8 py-4 border-2 rounded-2xl font-bold text-lg shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2 active:scale-95 ${
            isDarkMode 
            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
            : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'
          }`}
        >
          <RotateCcw size={20} />
          Seguir Practicando
        </button>
        <button
          onClick={handleShare}
          className={`w-full md:w-auto px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 active:scale-95 ${
            isShared ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'
          }`}
        >
          {isShared ? (
            <>
              <CheckCircle2 size={20} />
              ¡Copiado!
            </>
          ) : (
            <>
              <Share2 size={20} className="text-indigo-200" />
              Compartir
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
