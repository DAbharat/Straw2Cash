import React, { useState, useEffect } from 'react';
import { pythonAiMlApi } from '../lib/api/pythonService';
import { AssistantChatMessage } from '../types/aiml';
import { PageHeroBanner } from '../components/layout/PageHeroBanner';
import { Sparkles, Send, Bot, User, Globe2, Mic, MicOff, Volume2, Wrench, Check } from 'lucide-react';

interface AssistantPageProps {
  onNavigate: (path: string) => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ onNavigate }) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'pa'>('en');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: 'init_1',
      role: 'assistant',
      content:
        'Welcome to the Straw2Cash Agronomy & Market Assistant. I can assist you with residue estimation formulas, prevailing district mandi/biomass plant prices, baler machine dispatch, and guaranteed escrow contract flows in English, Hindi, or Punjabi.',
      timestamp: new Date().toISOString(),
      language: 'en',
      suggestedPrompts: [
        'What is the current market rate for square bales in Sangrur?',
        'How do I calculate recoverable straw from 35 acres of Basmati?',
        'What are the government penalties for stubble burning in Punjab?',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSpeechSupported(true);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'pa' ? 'pa-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const speakText = (text: string, lang: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'pa' ? 'pa-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AssistantChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await pythonAiMlApi.sendAssistantMessage(textToSend, language, messages);
      setMessages((prev) => [...prev, reply]);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: 'en' | 'hi' | 'pa') => {
    setLanguage(lang);
    let greeting = '';
    let prompts: string[] = [];

    if (lang === 'pa') {
      greeting = 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਸਟ੍ਰਾਅ ਟੂ ਕੈਸ਼ ਦਾ ਏ.ਆਈ. ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਨੂੰ ਪਰਾਲੀ ਦੇ ਮੌਜੂਦਾ ਮੰਡੀ ਭਾਅ, ਖੇਤ ਵਿੱਚੋਂ ਪਰਾਲੀ ਦਾ ਅੰਦਾਜ਼ਾ ਲਗਾਉਣ, ਬੇਲਰ ਮਸ਼ੀਨ ਬੁੱਕ ਕਰਨ ਅਤੇ ਬਾਇਓ-ਮਾਸ ਪਲਾਂਟਾਂ ਨਾਲ ਕੰਟਰੈਕਟ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।';
      prompts = [
        '35 ਏਕੜ ਬਾਸਮਤੀ ਝੋਨੇ ਵਿੱਚੋਂ ਕਿੰਨੀ ਪਰਾਲੀ ਬਣ ਸਕਦੀ ਹੈ?',
        'ਸੰਗਰੂਰ ਤੇ ਪਟਿਆਲਾ ਵਿੱਚ ਪਰਾਲੀ ਦੀਆਂ ਗੰਢਾਂ ਦਾ ਕੀ ਰੇਟ ਚੱਲ ਰਿਹਾ ਹੈ?',
        'ਸੁਪਰ ਐਸ.ਐਮ.ਐਸ ਅਤੇ ਬੇਲਰ ਮਸ਼ੀਨ ਕਿਵੇਂ ਬੁੱਕ ਕਰੀਏ?',
      ];
    } else if (lang === 'hi') {
      greeting = 'नमस्ते! मैं स्ट्रॉ2कैश का कृषि सहायक हूँ। मैं आपको पराली अवशेष का सही अनुमान लगाने, नजदीकी बेलर खोजने, बायो-एनर्जी खरीदारों से जुड़ने और डिजिटल अनुबंध में मदद कर सकता हूँ।';
      prompts = [
        '35 एकड़ बासमती धान से कितनी पराली (स्ट्रॉ) मिलेगी?',
        'संगरूर और करनाल में बेलर का किराया और पराली का भाव क्या है?',
        'खरीदार (बायर्स) से पेमेंट सुरक्षित कैसे मिलती है?',
      ];
    } else {
      greeting = 'Welcome to the Straw2Cash Agronomy Assistant. How can I assist your crop residue marketing today?';
      prompts = [
        'What is the current market rate for square bales in Sangrur?',
        'How do I calculate recoverable straw from 35 acres of Basmati?',
      ];
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `lang_change_${Date.now()}`,
        role: 'assistant',
        content: greeting,
        timestamp: new Date().toISOString(),
        language: lang,
        suggestedPrompts: prompts,
      },
    ]);
  };

  return (
    <div className="w-full">
      {/* Immersive AI Assistant Hero Section */}
      <PageHeroBanner
        badge="08 / Multilingual Agronomy Intelligence"
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-[#E5A812]" />}
        title="AI Agronomy & Stubble Market Desk"
        subtitle="Conversational agronomic advisor answering inquiries in Punjabi (ਪੰਜਾਬੀ), Hindi (हिंदी), and English regarding prevailing mandi rates, residue formulas, and CAQM zero-burning compliance."
        bgImageUrl="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2600&auto=format&fit=crop"
        stats={[
          { label: 'Supported Languages', value: '3 (PA, HI, EN)', highlight: true },
          { label: 'Average Latency', value: '1.2s' },
          { label: 'Speech Recognition', value: 'Active', highlight: true },
          { label: 'Agronomy Service', value: 'Port 8001 ML' },
        ]}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-4 sm:p-8 flex flex-col h-[650px]">
          {/* Header with language picker */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3DED2] shrink-0">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C88A1B] mb-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Python AI/ML Assistant (Port 8001 / Tools Engine)</span>
              </div>
              <h2 className="text-xl font-bold text-[#19241B]">
                Interactive Agronomy Consultation
              </h2>
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-1 p-1 bg-white/70 backdrop-blur-md rounded-xl border border-white/60 shadow-xs overflow-x-auto max-w-full">
              <Globe2 className="w-3.5 h-3.5 text-[#5E6D63] ml-1.5 mr-0.5 shrink-0" />
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                  language === 'en' ? 'bg-[#1B382B] text-white font-bold shadow-xs' : 'text-[#5E6D63] hover:text-[#19241B]'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('pa')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                  language === 'pa' ? 'bg-[#1B382B] text-white font-bold shadow-xs' : 'text-[#5E6D63] hover:text-[#19241B]'
                }`}
              >
                <span>ਪੰਜਾਬੀ</span>
                <span className="hidden sm:inline"> (Punjabi)</span>
              </button>
              <button
                onClick={() => handleLanguageChange('hi')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                  language === 'hi' ? 'bg-[#1B382B] text-white font-bold shadow-xs' : 'text-[#5E6D63] hover:text-[#19241B]'
                }`}
              >
                <span>हिंदी</span>
                <span className="hidden sm:inline"> (Hindi)</span>
              </button>
            </div>
          </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[#1B382B] text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${
                m.role === 'user'
                  ? 'bg-[#1B382B] text-white rounded-tr-none'
                  : 'bg-white/85 backdrop-blur-md border border-white/70 text-[#19241B] rounded-tl-none'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap flex-1">{m.content}</p>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speakText(m.content, m.language)}
                    className="p-1 rounded-md text-[#5E6D63] hover:text-[#1B382B] hover:bg-stone-200/50 transition-colors shrink-0 cursor-pointer"
                    title="Listen aloud (Text-to-Speech)"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tool Calls Chips matching Section 10 */}
              {m.tools_called && m.tools_called.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#E3DED2]/70 space-y-1">
                  {m.tools_called.map((tool, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EAEFEA] border border-[#1B382B]/20 text-[11px] text-[#1B382B] font-mono shadow-xs"
                    >
                      <Wrench className="w-3 h-3 text-[#1B382B]" />
                      <span className="font-bold">Called {tool.tool_name}:</span>
                      <span>{tool.summary}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggested prompt chips */}
              {m.suggestedPrompts && m.suggestedPrompts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E3DED2]/60 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#8A795D]">
                    Suggested Inquiries:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(p)}
                        className="px-2.5 py-1 bg-[#F2EDE2] hover:bg-[#E5DFD3] text-[#2D3A30] rounded-md text-[11px] transition-colors text-left cursor-pointer"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-right mt-1 opacity-60">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-[#C88A1B] text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#5E6D63] italic pl-11">
            <div className="w-2 h-2 rounded-full bg-[#1B382B] animate-ping" />
            <span>Consulting Python AI service (port 8001) tools...</span>
          </div>
        )}
      </div>

      {/* Input Form with Voice Support */}
      <div className="pt-3 border-t border-[#E3DED2] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                : 'bg-white border-[#D5CFBF] text-[#5E6D63] hover:text-[#1B382B] hover:border-[#1B382B]'
            }`}
            title={isListening ? 'Listening... click to stop' : 'Voice Input (Punjabi / Hindi / English)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to speech...'
                : language === 'pa'
                ? 'ਪਰਾਲੀ ਦੇ ਰੇਟ, ਬੇਲਰ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ (ਜਾਂ ਮਾਈਕ ਵਰਤੋ)...'
                : language === 'hi'
                ? 'पराली के भाव, बेलर मशीन या सब्सिडी के बारे में पूछें...'
                : 'Ask about straw pricing, baling logistics, residue formulas...'
            }
            className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 text-xs bg-white border border-[#D5CFBF] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1B382B] focus:border-[#1B382B]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#1B382B] text-white rounded-xl text-xs font-semibold hover:bg-[#12261D] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm shrink-0"
          >
            <span className="hidden min-[400px]:inline">Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
);
};
