
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Loader2, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { ReadingFeedback, VoiceOption } from '../types';
import { decode, decodeAudioData, createBlob } from '../services/audioHelper';

interface ReadingSessionProps {
  text: string;
  onTts: (text: string) => void;
  onStopTts: () => void;
  onComplete: (result: ReadingFeedback) => void;
  isTtsPlaying: boolean;
  selectedVoice: VoiceOption;
  isDarkMode: boolean;
}

const ReadingSession: React.FC<ReadingSessionProps> = ({ 
  text, 
  onTts, 
  onStopTts,
  onComplete, 
  isTtsPlaying, 
  selectedVoice,
  isDarkMode
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [statusMsg, setStatusMsg] = useState(`Escucha a ${selectedVoice.name} primero, luego intenta leerlo tú.`);
  const [timer, setTimer] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerIntervalRef = useRef<number | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const userTranscriptRef = useRef<string>("");

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopTracks();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      setTimer(0);
      userTranscriptRef.current = "";
      timerIntervalRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const stopTracks = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const startReading = async () => {
    setIsRecording(true);
    setStatusMsg("Te estoy escuchando... tómate tu tiempo.");
    setErrorMsg(null);
    userTranscriptRef.current = "";

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioCtx.createMediaStreamSource(stream);
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Capture user transcription in real-time
            if (message.serverContent?.inputTranscription) {
              userTranscriptRef.current += message.serverContent.inputTranscription.text;
            }
          },
          onerror: (e) => {
            console.error("Error de sesión en vivo:", e);
            setErrorMsg("Conexión perdida con el servicio de voz.");
            stopReading();
          },
          onclose: () => console.log("Sesión en vivo cerrada"),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          // Enable transcription to capture what the user says for later analysis
          inputAudioTranscription: {}, 
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice.voiceName }
            }
          },
          systemInstruction: `
            Eres un oyente silencioso y atento.
            Tu única tarea ahora es escuchar al usuario leer el siguiente texto: "${text}".
            NO hables ni interrumpas mientras el usuario lee. Solo transcribe y escucha.
          `,
        }
      });
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setIsRecording(false);
      setStatusMsg("Error al acceder al micrófono.");
    }
  };

  const stopReading = async () => {
    setIsRecording(false);
    stopTracks(); // Cut microphone immediately
    
    // Safety check for very short sessions
    if (timer < 2 && userTranscriptRef.current.length < 5) {
       setStatusMsg("La sesión fue muy corta. Inténtalo de nuevo.");
       return;
    }

    setIsAnalyzing(true);
    setStatusMsg("Generando análisis detallado con Gemini...");

    try {
      // Calculate estimated time based on 200 wpm
      const wordCount = text.split(/\s+/).length;
      const estimatedTime = Math.ceil((wordCount / 200) * 60);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // We use a robust Flash model for the analytical feedback based on the transcription
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ 
              text: `
                Analiza la siguiente sesión de lectura en inglés.
                
                Texto Original: "${text}"
                Transcripción del Usuario: "${userTranscriptRef.current}"
                
                Tiempo Real del Usuario: ${timer} segundos.
                Tiempo Estimado (Meta): ${estimatedTime} segundos (basado en 200 palabras/min).

                Proporciona un reporte en formato JSON estricto con los siguientes campos:
                - pronunciationScore: (0-100) Evalúa qué tan similar es la transcripción al texto original.
                - intonationScore: (0-100) Estima la entonación basándote en la fluidez del texto transcrito (uso de puntuación, pausas).
                - fluencyScore: (0-100) Evalúa la completitud del texto leído.
                - mistakes: Array de strings con las palabras mal pronunciadas o faltantes (en inglés).
                - tips: Array de strings con consejos prácticos y motivadores en ESPAÑOL.
                - difficultyLevel: String (ej: "Principiante A1", "Intermedio B1", "Avanzado C1") evaluando la complejidad del texto original.
                - grammarAnalysis: String con un breve análisis en ESPAÑOL sobre la estructura gramatical del texto original y si el usuario respetó la sintaxis.
                
                Asegúrate de ser constructivo pero preciso.
              ` 
            }]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pronunciationScore: { type: Type.NUMBER },
              intonationScore: { type: Type.NUMBER },
              fluencyScore: { type: Type.NUMBER },
              mistakes: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              tips: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              difficultyLevel: { type: Type.STRING },
              grammarAnalysis: { type: Type.STRING }
            },
            required: ["pronunciationScore", "intonationScore", "fluencyScore", "mistakes", "tips", "difficultyLevel", "grammarAnalysis"]
          }
        }
      });

      const analysisText = response.text;
      if (analysisText) {
        const data = JSON.parse(analysisText);
        onComplete({
          ...data,
          readingTimeSeconds: timer,
          estimatedTimeSeconds: estimatedTime
        });
      } else {
        throw new Error("Respuesta vacía de Gemini");
      }

    } catch (err) {
      console.error("Error en análisis:", err);
      setErrorMsg("No se pudo generar el reporte. Por favor intenta de nuevo.");
      setIsAnalyzing(false);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full animate-in fade-in zoom-in-95 duration-500">
      <div className={`rounded-[40px] shadow-2xl border transition-all duration-300 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      } overflow-hidden`}>
        <div className="p-8 md:p-12 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
              <span className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {isRecording ? "Modo Escucha" : isAnalyzing ? "Analizando" : "Práctica"}
              </span>
            </div>
            <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl font-mono font-black text-lg transition-colors ${
              isDarkMode ? 'bg-slate-900 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <Clock size={18} />
              {formatTime(timer)}
            </div>
          </div>

          <div className="relative py-4 min-h-[150px]">
            <p className={`text-3xl md:text-4xl font-semibold leading-[1.7] text-left tracking-tight transition-colors ${
              isDarkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              {text}
            </p>
          </div>

          <div className={`flex flex-col items-center gap-6 border-t pt-8 transition-colors ${
            isDarkMode ? 'border-slate-700' : 'border-slate-50'
          }`}>
            <div className="space-y-2 w-full text-center">
              <p className={`font-medium italic transition-colors ${
                isDarkMode ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {statusMsg}
              </p>
              {errorMsg && (
                <div className="flex items-center justify-center gap-2 text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                  <AlertTriangle size={16} />
                  {errorMsg}
                </div>
              )}
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-6 gap-4">
                 <Loader2 size={48} className="text-indigo-500 animate-spin" />
                 <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest animate-pulse">Procesando resultados...</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-lg">
                <button
                  onClick={() => isTtsPlaying ? onStopTts() : onTts(text)}
                  disabled={isRecording}
                  className={`flex-1 py-5 rounded-3xl flex items-center justify-center gap-4 transition-all font-bold text-lg px-8 active:scale-95 ${
                    isTtsPlaying 
                    ? (isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-100')
                    : (isDarkMode ? 'bg-slate-900 text-slate-400 border border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent')
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {isTtsPlaying ? (
                    <>
                      <Square size={18} fill="currentColor" />
                      <span>Detener</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={24} />
                      <span>Escuchar</span>
                    </>
                  )}
                </button>

                {!isRecording ? (
                  <button
                    onClick={startReading}
                    disabled={isTtsPlaying}
                    className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed px-8 shadow-indigo-500/20"
                  >
                    <Mic size={24} className="text-indigo-200" />
                    <span className="font-bold text-lg">Leer ahora</span>
                  </button>
                ) : (
                  <button
                    onClick={stopReading}
                    className="flex-1 py-5 bg-red-500 text-white rounded-3xl flex items-center justify-center gap-4 hover:bg-red-600 transition-all shadow-xl active:scale-95 px-8"
                  >
                    <Square size={20} fill="currentColor" />
                    <span className="font-bold text-lg">Finalizar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`h-2.5 w-full transition-colors ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000" 
            style={{ width: isRecording ? '100%' : '0%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReadingSession;
