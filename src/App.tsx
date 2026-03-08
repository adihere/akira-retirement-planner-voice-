import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, LiveServerMessage, Modality } from '@google/genai';
import { Mic, Square, Loader2, Sparkles, Target, TrendingUp } from 'lucide-react';
import { AudioRecorder, AudioStreamer } from './lib/audio';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SYSTEM_INSTRUCTION = `You are Akira, a warm, expert UK Retirement Coach. Your goal is to help users visualize and plan their retirement through a natural, voice-first conversation.

You must collect the following data points, one or two questions at a time to keep the conversation fluid:
1. The Dream: What does retirement look like? (e.g., 3-bed house in the Cotswolds vs. a flat in London).
2. Current Nest Egg: Pension balances (Workplace/SIPP) and ISA savings.
3. Home Equity: Mortgage status and current equity.
4. Family: Number of kids and any specific "Uni Fund" goals.
5. Lifestyle Costs: Foreign vs. domestic travel, and monthly "fun money" for food/entertainment.
6. Time Horizon: Current age vs. target retirement age.

Rules of Engagement:
- Speak like a human: Avoid saying "I am an AI." Use phrases like "That sounds like a lovely plan" or "Right, let's look at the numbers."
- Inflation & Math: Internally calculate figures using a standard 2.5% inflation rate for costs. When discussing future pots, clarify that "£1,000 today won't buy the same in 20 years."
- Interactive: After every 2 pieces of data collected, give a "mini-insight" to keep the user engaged.
- Be concise. Do not list all questions at once. Ask naturally.
- Visuals: If the user asks to see a projection or forecast of their savings, use the \`calculateRetirementProjection\` tool to show them a chart.
- Snapshot: Whenever you learn or update the user's age, target retirement age, pension balance, ISA balance, home equity, or monthly "fun money", call the \`updateSnapshot\` tool to keep their dashboard current.

The Grand Finale:
Once ALL data is collected, you MUST call the \`triggerGrandFinale\` tool.
Pass in:
- realityCheck: A concise summary of if they are on track, considering inflation.
- imagePrompt: A detailed prompt to generate a Vision Board image of their described retirement home and lifestyle.
- wayForward: Three specific, actionable suggestions.

After calling the tool, wrap up the conversation warmly.`;

const triggerGrandFinaleDeclaration = {
  name: "triggerGrandFinale",
  description: "Triggers the Grand Finale presentation once all user data is collected.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      realityCheck: {
        type: Type.STRING,
        description: "A concise summary of if they are on track, considering 2.5% inflation."
      },
      imagePrompt: {
        type: Type.STRING,
        description: "A detailed prompt to generate a Vision Board image of their described retirement home and lifestyle."
      },
      wayForward: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Three specific, actionable suggestions for their retirement plan."
      }
    },
    required: ["realityCheck", "imagePrompt", "wayForward"]
  }
};

const calculateRetirementProjectionDeclaration = {
  name: "calculateRetirementProjection",
  description: "Calculates and displays a visual chart of the user's projected retirement savings over time. Use this when the user asks to see a projection or forecast of their savings.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      currentAge: { type: Type.NUMBER, description: "User's current age" },
      retirementAge: { type: Type.NUMBER, description: "Target retirement age" },
      currentSavings: { type: Type.NUMBER, description: "Total current savings/pension pot" },
      monthlyContribution: { type: Type.NUMBER, description: "Monthly contribution amount" },
      expectedAnnualReturn: { type: Type.NUMBER, description: "Expected annual return percentage (e.g., 5 for 5%)" }
    },
    required: ["currentAge", "retirementAge", "currentSavings", "monthlyContribution", "expectedAnnualReturn"]
  }
};

const updateSnapshotDeclaration = {
  name: "updateSnapshot",
  description: "Updates the user's retirement snapshot with new information learned during the conversation.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      currentAge: { type: Type.NUMBER, description: "User's current age" },
      targetAge: { type: Type.NUMBER, description: "Target retirement age" },
      pensionTotal: { type: Type.NUMBER, description: "Total pension balance" },
      isaTotal: { type: Type.NUMBER, description: "Total ISA balance" },
      homeEquity: { type: Type.STRING, description: "Home ownership status or equity" },
      monthlyFunMoney: { type: Type.NUMBER, description: "Monthly 'fun money' or lifestyle costs" }
    }
  }
};

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [finaleData, setFinaleData] = useState<any>(null);
  const [projectionData, setProjectionData] = useState<any[] | null>(null);
  const [snapshot, setSnapshot] = useState<any>(() => {
    const saved = localStorage.getItem('akira_snapshot');
    return saved ? JSON.parse(saved) : null;
  });
  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('akira_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [liveTranscript, setLiveTranscript] = useState<{role: 'user' | 'model', text: string} | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, liveTranscript]);

  const clearHistory = () => {
    localStorage.removeItem('akira_history');
    localStorage.removeItem('akira_snapshot');
    setHistory([]);
    setSnapshot(null);
  };

  const connect = async () => {
    setIsConnecting(true);
    setFinaleData(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioStreamerRef.current = new AudioStreamer();
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [triggerGrandFinaleDeclaration, calculateRetirementProjectionDeclaration, updateSnapshotDeclaration] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            sessionPromise.then(session => {
              if (history.length > 0) {
                session.sendClientContent({ turns: history, turnComplete: true });
              }
            });
            
            audioRecorderRef.current = new AudioRecorder((base64) => {
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            });
            audioRecorderRef.current.start();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const t = message.serverContent.inputTranscription;
              if (t.text) {
                currentInputRef.current += t.text;
                setLiveTranscript({ role: 'user', text: currentInputRef.current });
              }
              if (t.finished && currentInputRef.current.trim()) {
                setHistory(prev => {
                  const newHistory = [...prev, { role: 'user', parts: [{ text: currentInputRef.current }] }];
                  localStorage.setItem('akira_history', JSON.stringify(newHistory));
                  return newHistory;
                });
                currentInputRef.current = '';
                setLiveTranscript(null);
              }
            }
            if (message.serverContent?.outputTranscription) {
              const t = message.serverContent.outputTranscription;
              if (t.text) {
                currentOutputRef.current += t.text;
                setLiveTranscript({ role: 'model', text: currentOutputRef.current });
              }
              if (t.finished && currentOutputRef.current.trim()) {
                setHistory(prev => {
                  const newHistory = [...prev, { role: 'model', parts: [{ text: currentOutputRef.current }] }];
                  localStorage.setItem('akira_history', JSON.stringify(newHistory));
                  return newHistory;
                });
                currentOutputRef.current = '';
                setLiveTranscript(null);
              }
            }

            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && audioStreamerRef.current) {
                  audioStreamerRef.current.addPCM16(part.inlineData.data);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              if (audioStreamerRef.current) {
                audioStreamerRef.current.interrupt();
              }
              if (currentOutputRef.current.trim()) {
                setHistory(prev => {
                  const newHistory = [...prev, { role: 'model', parts: [{ text: currentOutputRef.current }] }];
                  localStorage.setItem('akira_history', JSON.stringify(newHistory));
                  return newHistory;
                });
                currentOutputRef.current = '';
                setLiveTranscript(null);
              }
            }
            if (message.toolCall) {
              const functionCalls = message.toolCall.functionCalls;
              if (functionCalls) {
                for (const call of functionCalls) {
                  if (call.name === 'triggerGrandFinale') {
                    const args = call.args as any;
                    setFinaleData({
                      realityCheck: args.realityCheck,
                      imagePrompt: args.imagePrompt,
                      wayForward: args.wayForward,
                      imageUrl: null
                    });
                    
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { status: "success" }
                        }]
                      });
                    });

                    try {
                      const imageAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                      const imgRes = await imageAi.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: args.imagePrompt,
                      });
                      let imageUrl = null;
                      for (const p of imgRes.candidates?.[0]?.content?.parts || []) {
                        if (p.inlineData) {
                          imageUrl = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
                          break;
                        }
                      }
                      setFinaleData(prev => prev ? { ...prev, imageUrl } : null);
                    } catch (e) {
                      console.error("Image generation error", e);
                    }
                  } else if (call.name === 'calculateRetirementProjection') {
                    const args = call.args as any;
                    const { currentAge, retirementAge, currentSavings, monthlyContribution, expectedAnnualReturn } = args;
                    
                    const years = retirementAge - currentAge;
                    const data = [];
                    let balance = currentSavings;
                    const monthlyRate = (expectedAnnualReturn / 100) / 12;

                    for (let year = 0; year <= years; year++) {
                      data.push({
                        age: currentAge + year,
                        balance: Math.round(balance)
                      });
                      // Calculate next year's balance
                      for (let month = 0; month < 12; month++) {
                        balance = balance * (1 + monthlyRate) + monthlyContribution;
                      }
                    }

                    setProjectionData(data);

                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { status: "success", projectedFinalBalance: Math.round(balance) }
                        }]
                      });
                    });
                  } else if (call.name === 'updateSnapshot') {
                    const args = call.args as any;
                    setSnapshot((prev: any) => {
                      const newSnapshot = { ...prev, ...args, lastSessionDate: new Date().toLocaleDateString() };
                      localStorage.setItem('akira_snapshot', JSON.stringify(newSnapshot));
                      return newSnapshot;
                    });
                    sessionPromise.then(session => {
                      session.sendToolResponse({
                        functionResponses: [{
                          id: call.id,
                          name: call.name,
                          response: { status: "success" }
                        }]
                      });
                    });
                  }
                }
              }
            }
          },
          onclose: () => {
            disconnect();
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            disconnect();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (error) {
      console.error("Connection failed:", error);
      setIsConnecting(false);
      disconnect();
    }
  };

  const disconnect = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-warm-white py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-6xl space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column */}
          <div className="space-y-12 flex flex-col">
            <div className="text-center lg:text-left space-y-4">
              <h1 className="text-5xl md:text-6xl font-serif text-olive">Akira</h1>
              <p className="text-lg text-olive-light font-medium tracking-wide uppercase">Your UK Retirement Coach</p>
            </div>

            <div className="flex flex-col items-center lg:items-start justify-center py-12 space-y-8">
              {!isConnected && !isConnecting ? (
                <div className="flex flex-col items-center lg:items-start space-y-16">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={connect}
                    className="group relative flex items-center justify-center w-32 h-32 rounded-full bg-olive text-white shadow-xl hover:bg-olive-light transition-colors duration-300 cursor-pointer"
                  >
                    <Mic size={40} className="group-hover:scale-110 transition-transform" />
                    <div className="absolute -bottom-12 text-olive font-medium whitespace-nowrap">
                      {history.length > 0 ? 'Resume Session' : 'Tap to Start'}
                    </div>
                  </motion.button>
                  
                  {history.length > 0 && (
                    <button 
                      onClick={clearHistory}
                      className="text-sm text-olive-light hover:text-red-600 transition-colors underline underline-offset-4"
                    >
                      Clear History & Start Fresh
                    </button>
                  )}
                </div>
              ) : isConnecting ? (
                <div className="flex flex-col items-center lg:items-start space-y-4">
                  <Loader2 size={48} className="text-olive animate-spin" />
                  <div className="text-olive font-medium">Waking up Akira...</div>
                </div>
              ) : (
                <div className="flex flex-col items-center lg:items-start space-y-8">
                  <div className="relative flex items-center justify-center w-40 h-40">
                    <div className="absolute inset-0 rounded-full bg-olive opacity-20 animate-ping"></div>
                    <div className="absolute inset-4 rounded-full bg-olive opacity-40 animate-pulse"></div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={disconnect}
                      className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-olive text-white shadow-lg hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <Square size={24} fill="currentColor" />
                    </motion.button>
                  </div>
                  <div className="text-olive font-medium text-lg">Akira is listening...</div>
                </div>
              )}
            </div>

            {projectionData && !finaleData && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-white p-6 rounded-3xl shadow-sm border border-olive/10"
              >
                <div className="flex items-center space-x-3 text-olive mb-6 justify-center">
                  <TrendingUp size={24} />
                  <h3 className="text-xl font-serif">Retirement Projection</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis 
                        dataKey="age" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#8E9299', fontSize: 12 }} 
                        tickFormatter={(value) => `Age ${value}`}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: '#8E9299', fontSize: 12 }}
                        tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`£${value.toLocaleString()}`, 'Projected Balance']}
                        labelFormatter={(label) => `Age ${label}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#5A5A40" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {(history.length > 0 || liveTranscript) && !finaleData && (
              <div className="w-full space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-olive/10">
                <h3 className="text-xl font-serif text-olive text-center mb-6">Conversation History</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  <AnimatePresence initial={false}>
                    {history.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                              ? 'bg-olive text-white rounded-br-sm' 
                              : 'bg-warm-white text-gray-800 rounded-bl-sm border border-olive/10'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.parts[0].text}</p>
                        </div>
                      </motion.div>
                    ))}
                    {liveTranscript && (
                      <motion.div
                        key="live-transcript"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${liveTranscript.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            liveTranscript.role === 'user' 
                              ? 'bg-olive/80 text-white rounded-br-sm' 
                              : 'bg-warm-white/80 text-gray-800 rounded-bl-sm border border-olive/10'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{liveTranscript.text}</p>
                          <span className="inline-block w-1.5 h-4 ml-1 bg-current animate-pulse align-middle" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:pt-[120px]">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-olive/10 sticky top-12">
              <h3 className="text-2xl font-serif text-olive mb-6">Retirement Snapshot</h3>
              
              {!snapshot ? (
                <div className="space-y-4 text-gray-600">
                  <p className="font-medium text-olive">What Akira can do for you:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-olive/10 text-olive flex items-center justify-center text-sm font-medium">1</div>
                      <span>Listen to your retirement goals</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-olive/10 text-olive flex items-center justify-center text-sm font-medium">2</div>
                      <span>Estimate whether you're broadly on track</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-olive/10 text-olive flex items-center justify-center text-sm font-medium">3</div>
                      <span>Suggest next steps for pensions, ISAs, and lifestyle</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-olive/10 text-olive flex items-center justify-center text-sm font-medium">4</div>
                      <span>Create a vision-board style image of your retirement</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-warm-white p-4 rounded-2xl">
                      <div className="text-sm text-olive-light mb-1">Current Age</div>
                      <div className="text-2xl font-serif text-olive">{snapshot.currentAge || '--'}</div>
                    </div>
                    <div className="bg-warm-white p-4 rounded-2xl">
                      <div className="text-sm text-olive-light mb-1">Target Age</div>
                      <div className="text-2xl font-serif text-olive">{snapshot.targetAge || '--'}</div>
                    </div>
                    <div className="bg-warm-white p-4 rounded-2xl">
                      <div className="text-sm text-olive-light mb-1">Pension Total</div>
                      <div className="text-2xl font-serif text-olive">{snapshot.pensionTotal ? `£${snapshot.pensionTotal.toLocaleString()}` : '--'}</div>
                    </div>
                    <div className="bg-warm-white p-4 rounded-2xl">
                      <div className="text-sm text-olive-light mb-1">ISA Total</div>
                      <div className="text-2xl font-serif text-olive">{snapshot.isaTotal ? `£${snapshot.isaTotal.toLocaleString()}` : '--'}</div>
                    </div>
                    <div className="bg-warm-white p-4 rounded-2xl">
                      <div className="text-sm text-olive-light mb-1">Home Equity</div>
                      <div className="text-lg font-medium text-olive">{snapshot.homeEquity || '--'}</div>
                    </div>
                    <div className="bg-warm-white p-4 rounded-2xl">
                      <div className="text-sm text-olive-light mb-1">Fun Money / mo</div>
                      <div className="text-2xl font-serif text-olive">{snapshot.monthlyFunMoney ? `£${snapshot.monthlyFunMoney.toLocaleString()}` : '--'}</div>
                    </div>
                  </div>

                  {snapshot.lastSessionDate && (
                    <div className="text-xs text-center text-olive-light pt-4 border-t border-olive/10">
                      Last updated: {snapshot.lastSessionDate}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {finaleData && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-olive/10"
            >
              <div className="p-8 md:p-12 space-y-12">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl font-serif text-olive">Your Vision Board</h2>
                  <p className="text-olive-light">A glimpse into your future</p>
                </div>

                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-warm-white flex items-center justify-center shadow-inner">
                  {finaleData.imageUrl ? (
                    <img src={finaleData.imageUrl} alt="Retirement Vision" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="flex flex-col items-center text-olive-light space-y-4">
                      <Loader2 size={32} className="animate-spin" />
                      <p>Painting your dream...</p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-olive">
                      <Target size={24} />
                      <h3 className="text-2xl font-serif font-semibold">The Reality Check</h3>
                    </div>
                    <div className="prose prose-olive text-gray-700 leading-relaxed">
                      <ReactMarkdown>{finaleData.realityCheck}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 text-olive">
                      <Sparkles size={24} />
                      <h3 className="text-2xl font-serif font-semibold">The Way Forward</h3>
                    </div>
                    <ul className="space-y-4">
                      {finaleData.wayForward.map((step: string, i: number) => (
                        <li key={i} className="flex items-start space-x-4 bg-warm-white p-4 rounded-xl">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-olive text-white flex items-center justify-center font-serif text-lg">
                            {i + 1}
                          </div>
                          <p className="text-gray-800 pt-1 leading-relaxed">{step}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
