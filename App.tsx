import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  RotateCcw, 
  Moon,
  Sun
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { AppStep, ReadingFeedback, VoiceOption, VOICE_OPTIONS } from './types';
import { decode, decodeAudioData } from './services/audioHelper';

// Components
import TextEntry from './components/TextEntry';
import ReadingSession from './components/ReadingSession';
import FeedbackDashboard from './components/FeedbackDashboard';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.ENTRY);
  const [inputText, setInputText] = useState<string>("");
  const [feedback, setFeedback] = useState<ReadingFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[1]); // Default Sarah
  const [history, setHistory] = useState<string[]>([]);

  // Audio Contexts for TTS
  const ttsAudioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Load state on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('fluentread_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedVoiceId = localStorage.getItem('fluentread_voice');
    if (savedVoiceId) {
      const v = VOICE_OPTIONS.find(vo => vo.id === savedVoiceId);
      if (v) setSelectedVoice(v);
    }

    const savedDarkMode = localStorage.getItem('fluentread_darkmode');
    if (savedDarkMode === 'true') setIsDarkMode(true);
  }, []);

  // Save dark mode preference and apply class
  useEffect(() => {
    localStorage.setItem('fluentread_darkmode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const saveToHistory = (text: string) => {
    const newHistory = [text, ...history.filter(h => h !== text)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('fluentread_history', JSON.stringify(newHistory));
  };

  const handleVoiceChange = (voice: VoiceOption) => {
    setSelectedVoice(voice);
    localStorage.setItem('fluentread_voice', voice.id);
  };

  const stopTts = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setIsProcessing(false);
  };

  const startTts = async (text: string) => {
    if (isProcessing) {
      stopTts();
      return;
    }
    
    setIsProcessing(true);

    try {
      // Use named parameter and direct process.env.API_KEY as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ 
          parts: [{ 
            text: `Lee este texto de forma natural y cálida con un acento de ${selectedVoice.accent === 'US' ? 'Estados Unidos' : 'Reino Unido'}: ${text}` 
          }] 
        }],
        config: {
          // Use Modality enum instead of string literal to fix type error
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice.voiceName },
            },
          },
        },
      });

      if (!ttsAudioContextRef.current) {
        ttsAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = ttsAudioContextRef.current;
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          ctx,
          24000,
          1,
        );
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        currentSourceRef.current = source;
        source.start();
        
        source.onended = () => {
          if (currentSourceRef.current === source) {
            setIsProcessing(false);
            currentSourceRef.current = null;
          }
        };
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = (text: string) => {
    setInputText(text);
    saveToHistory(text);
    setStep(AppStep.PRACTICE);
  };

  const handleSessionComplete = (result: ReadingFeedback) => {
    setFeedback(result);
    setStep(AppStep.FEEDBACK);
  };

  const reset = () => {
    stopTts();
    setStep(AppStep.ENTRY);
    setFeedback(null);
    setInputText("");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'} flex flex-col items-center p-4 md:p-8`}>
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <BookOpen size={24} />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            FluentRead <span className="text-indigo-500">AI</span>
          </h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full transition-all border shadow-sm active:scale-90 ${
              isDarkMode ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
            title="Cambiar Modo"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {step !== AppStep.ENTRY && (
            <button 
              onClick={reset}
              className={`flex items-center gap-3 px-4 py-2 text-sm font-semibold rounded-full transition-all border shadow-sm active:scale-95 ${
                isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RotateCcw size={16} />
              Nueva Lección
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-4xl flex-1">
        {step === AppStep.ENTRY && (
          <TextEntry 
            onSubmit={handleTextSubmit} 
            history={history} 
            selectedVoice={selectedVoice}
            onVoiceChange={handleVoiceChange}
            isDarkMode={isDarkMode}
          />
        )}

        {step === AppStep.PRACTICE && (
          <ReadingSession 
            text={inputText} 
            onTts={startTts} 
            onStopTts={stopTts}
            onComplete={handleSessionComplete} 
            isTtsPlaying={isProcessing}
            selectedVoice={selectedVoice}
            isDarkMode={isDarkMode}
          />
        )}

        {step === AppStep.FEEDBACK && feedback && (
          <FeedbackDashboard 
            feedback={feedback} 
            text={inputText} 
            onRetry={() => setStep(AppStep.PRACTICE)} 
            isDarkMode={isDarkMode}
          />
        )}
      </main>

      <footer className={`mt-12 text-sm pb-8 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Diseñado para el aprendizaje • Potenciado por Gemini AI
      </footer>
    </div>
  );
};

export default App;