
import React, { useState, useEffect, useRef } from 'react';
import { Language, TranslationResult, HistoryItem } from './types';
import { translateText, generateSpeech, decodeAudioBuffer } from './geminiService';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>(Language.TIBETAN);
  const [targetLang, setTargetLang] = useState<Language>(Language.VIETNAMESE);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'translate' | 'history'>('translate');
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('tibetan_vi_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveToHistory = (source: string, target: string, sLang: Language, tLang: Language) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      sourceText: source,
      targetText: target,
      sourceLang: sLang,
      targetLang: tLang,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('tibetan_vi_history', JSON.stringify(updatedHistory));
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await translateText(inputText, sourceLang, targetLang);
      setResult(res);
      saveToHistory(inputText, res.translatedText, sourceLang, targetLang);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText('');
    setResult(null);
  };

  const handlePlayAudio = async (text: string, lang: Language) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const audioData = await generateSpeech(text, lang);
    if (audioData) {
      const buffer = await decodeAudioBuffer(audioData, ctx);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-slate-200 flex flex-col font-sans">
      {/* Header Chuyên Nghiệp */}
      <header className="bg-[#8B0000] border-b-2 border-[#D4AF37] shadow-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#D4AF37] rounded-full blur-sm opacity-50 animate-pulse"></div>
              <div className="bg-[#D4AF37] p-2 rounded-full relative z-10 border-2 border-white/20">
                <i className="fas fa-dharmachakra text-[#8B0000] text-3xl animate-spin-slow"></i>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-[#D4AF37] drop-shadow-md">TỪ NGỮ TẠNG VIỆT</h1>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">VISION 1.0</span>
                <span className="text-xs text-white/70 italic italic tracking-tight">Cổng thông tin ngôn ngữ Tạng đầu tiên tại VN</span>
              </div>
            </div>
          </div>
          <nav className="flex space-x-8 mt-4 md:mt-0 font-bold uppercase tracking-widest text-sm">
            <button 
              onClick={() => setActiveTab('translate')}
              className={`pb-1 transition-all duration-300 border-b-2 ${activeTab === 'translate' ? 'text-[#FFD700] border-[#FFD700]' : 'text-white/60 border-transparent hover:text-white'}`}
            >
              <i className="fas fa-language mr-2"></i>Dịch thuật
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`pb-1 transition-all duration-300 border-b-2 ${activeTab === 'history' ? 'text-[#FFD700] border-[#FFD700]' : 'text-white/60 border-transparent hover:text-white'}`}
            >
              <i className="fas fa-history mr-2"></i>Lịch sử
            </button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto flex-grow p-4 md:p-8 max-w-6xl">
        {activeTab === 'translate' ? (
          <div className="grid grid-cols-1 gap-8 animate-fadeIn">
            {/* Vùng dịch chính */}
            <div className="glass-card rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-[#D4AF37]/30">
              {/* Toolbar */}
              <div className="bg-[#1a1a1a] p-4 border-b border-[#D4AF37]/20 flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="px-4 py-1.5 bg-[#8B0000] text-[#D4AF37] rounded-lg font-bold border border-[#D4AF37]/40 shadow-inner">
                    {sourceLang === Language.TIBETAN ? 'བོད་སྐད། Tibetan' : 'Tiếng Việt'}
                  </div>
                  <button onClick={swapLanguages} className="w-10 h-10 rounded-full flex items-center justify-center bg-[#D4AF37] text-black hover:scale-110 transition-transform shadow-lg">
                    <i className="fas fa-exchange-alt"></i>
                  </button>
                  <div className="px-4 py-1.5 bg-[#8B0000] text-[#D4AF37] rounded-lg font-bold border border-[#D4AF37]/40 shadow-inner">
                    {targetLang === Language.TIBETAN ? 'བོད་སྐད། Tibetan' : 'Tiếng Việt'}
                  </div>
                </div>
                <div className="hidden md:flex space-x-2">
                   <span className="w-3 h-3 rounded-full bg-red-500"></span>
                   <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                   <span className="w-3 h-3 rounded-full bg-green-500"></span>
                </div>
              </div>

              {/* Text Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 bg-[#0c0c0c]/40">
                <div className="p-6 relative group border-b md:border-b-0 md:border-r border-[#D4AF37]/10">
                  <textarea
                    className={`w-full h-64 bg-transparent text-white placeholder-white/20 text-xl focus:outline-none resize-none leading-relaxed ${sourceLang === Language.TIBETAN ? 'tibetan-font text-3xl pt-2' : ''}`}
                    placeholder={sourceLang === Language.TIBETAN ? 'Nhập chữ Tạng བོད་ཡིག་...' : 'Nhập văn bản Tiếng Việt...'}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-6 flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setInputText('')} className="text-white/40 hover:text-red-500"><i className="fas fa-times-circle"></i></button>
                    <button onClick={() => handlePlayAudio(inputText, sourceLang)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 transition"><i className="fas fa-volume-up"></i></button>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] relative group min-h-[16rem]">
                  {loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                       <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#D4AF37]"></div>
                       <p className="mt-4 text-[#D4AF37] font-bold tracking-widest animate-pulse">AI ĐANG PHÂN TÍCH...</p>
                    </div>
                  )}
                  <div className={`w-full h-64 overflow-y-auto pr-2 text-xl leading-relaxed ${targetLang === Language.TIBETAN ? 'tibetan-font text-3xl pt-2' : 'text-white/90'}`}>
                    {result ? result.translatedText : <span className="text-white/10 italic">Kết quả sẽ hiển thị ở đây...</span>}
                  </div>
                  {result && (
                    <div className="absolute bottom-4 right-6 flex items-center space-x-3">
                      <button onClick={() => handlePlayAudio(result.translatedText, targetLang)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-[#D4AF37] hover:text-black flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 transition shadow-lg"><i className="fas fa-volume-up"></i></button>
                      <button onClick={() => navigator.clipboard.writeText(result.translatedText)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 transition"><i className="fas fa-copy"></i></button>
                    </div>
                  )}
                  {result?.transliteration && (
                    <div className="absolute top-4 right-6 bg-[#8B0000]/80 px-3 py-1 rounded-full border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-mono">
                      {result.transliteration}
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="p-6 bg-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center text-xs text-[#D4AF37]/60 italic">
                  <i className="fas fa-shield-alt mr-2"></i> Sử dụng mô hình Gemini 3 Pro - Bảo mật & Chính xác
                </div>
                <button
                  onClick={handleTranslate}
                  disabled={loading || !inputText.trim()}
                  className="w-full md:w-auto px-12 py-4 gold-gradient text-black font-black text-lg rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.6)] hover:-translate-y-1 transition-all disabled:opacity-30 disabled:translate-y-0 uppercase tracking-widest flex items-center justify-center space-x-3"
                >
                  <i className="fas fa-bolt"></i>
                  <span>DỊCH NGAY</span>
                </button>
              </div>
            </div>

            {/* Chi tiết phân tích */}
            {result && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12 animate-slideUp">
                <div className="lg:col-span-2 space-y-8">
                  <section className="glass-card rounded-3xl p-8 border-l-4 border-[#D4AF37]">
                    <h3 className="text-[#D4AF37] text-xl font-bold mb-6 flex items-center">
                      <i className="fas fa-brain mr-3"></i> PHÂN TÍCH NGỮ PHÁP & NGỮ CẢNH
                    </h3>
                    <div className="text-white/80 leading-loose text-lg whitespace-pre-line bg-black/20 p-6 rounded-2xl">
                      {result.grammarAnalysis || "AI đang tổng hợp dữ liệu ngôn ngữ học..."}
                    </div>
                  </section>

                  <section className="glass-card rounded-3xl p-8">
                    <h3 className="text-[#D4AF37] text-xl font-bold mb-6 flex items-center">
                      <i className="fas fa-lightbulb mr-3"></i> CÁC VÍ DỤ SỬ DỤNG
                    </h3>
                    <div className="space-y-4">
                      {result.examples.map((ex, i) => (
                        <div key={i} className="group p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-[#D4AF37]/40 transition-colors">
                          <p className={`text-xl font-bold mb-3 ${sourceLang === Language.TIBETAN ? 'tibetan-font text-2xl text-[#D4AF37]' : 'text-white'}`}>
                            {ex.original}
                          </p>
                          <div className="flex items-center space-x-2 text-white/50 italic">
                            <i className="fas fa-arrow-right text-[10px]"></i>
                            <p>{ex.translated}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                   <section className="red-gradient rounded-3xl p-8 shadow-xl border border-white/10">
                      <h3 className="text-[#FFD700] text-xl font-bold mb-4 flex items-center uppercase tracking-tighter">
                        <i className="fas fa-scroll mr-3"></i> Nguồn gốc Từ vựng
                      </h3>
                      <p className="text-white/90 italic leading-relaxed text-lg">
                        {result.etymology || "Từ vựng này mang ý nghĩa triết học sâu sắc trong văn hóa cổ truyền Tây Tạng."}
                      </p>
                   </section>

                   <div className="bg-[#D4AF37] p-8 rounded-3xl text-black shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 text-black/10 text-9xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <i className="fas fa-dharmachakra"></i>
                      </div>
                      <h4 className="font-black text-xl mb-4 uppercase tracking-wider">Thông tin VPS</h4>
                      <p className="font-mono text-sm mb-4 font-bold">Node IP: 160.191.51.55</p>
                      <ul className="text-sm space-y-2 font-medium opacity-80">
                        <li className="flex items-center"><i className="fas fa-check-circle mr-2"></i> Kết nối HTTPS bảo mật</li>
                        <li className="flex items-center"><i className="fas fa-check-circle mr-2"></i> Độ trễ thấp: 150ms</li>
                        <li className="flex items-center"><i className="fas fa-check-circle mr-2"></i> Data: Tibetan Dictionary 1.0</li>
                      </ul>
                   </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-8 border border-[#D4AF37]/30 max-w-4xl mx-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-[#D4AF37]">LỊCH SỬ DỊCH THUẬT</h2>
              <button onClick={() => {setHistory([]); localStorage.clear();}} className="text-red-500 hover:text-red-400 font-bold text-sm uppercase tracking-widest px-4 py-2 bg-red-500/10 rounded-lg">
                Xóa tất cả
              </button>
            </div>
            
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <i className="fas fa-folder-open text-8xl mb-4"></i>
                  <p className="text-xl font-bold">Trống</p>
                </div>
              ) : history.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => {
                    setSourceLang(item.sourceLang);
                    setTargetLang(item.targetLang);
                    setInputText(item.sourceText);
                    setActiveTab('translate');
                  }}
                  className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center space-x-2 text-[10px] text-[#D4AF37] mb-2 font-bold uppercase">
                      <span>{item.sourceLang}</span>
                      <i className="fas fa-long-arrow-alt-right"></i>
                      <span>{item.targetLang}</span>
                      <span className="opacity-40">•</span>
                      <span className="opacity-40">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className={`text-lg font-bold truncate ${item.sourceLang === Language.TIBETAN ? 'tibetan-font text-xl' : ''}`}>
                      {item.sourceText}
                    </p>
                    <p className="text-white/40 truncate text-sm italic">{item.targetText}</p>
                  </div>
                  <i className="fas fa-arrow-right text-[#D4AF37] opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all"></i>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-black border-t border-[#D4AF37]/20 p-12 mt-12">
        <div className="container mx-auto text-center">
          <div className="flex justify-center space-x-8 mb-8">
             <a href="#" className="text-white/40 hover:text-[#D4AF37] transition-colors"><i className="fab fa-facebook-f text-2xl"></i></a>
             <a href="#" className="text-white/40 hover:text-[#D4AF37] transition-colors"><i className="fab fa-github text-2xl"></i></a>
             <a href="#" className="text-white/40 hover:text-[#D4AF37] transition-colors"><i className="fab fa-telegram-plane text-2xl"></i></a>
          </div>
          <p className="text-[#D4AF37] font-bold tracking-widest mb-2">TỪ NGỮ TẠNG VIỆT © 2024</p>
          <p className="text-white/20 text-xs max-w-xl mx-auto leading-relaxed">
            Ứng dụng dịch thuật thông minh sử dụng trí tuệ nhân tạo Gemini 3.0, được tối ưu hóa cho cộng đồng nghiên cứu Phật học và ngôn ngữ Tạng tại Việt Nam. 
            Vận hành trên nền tảng VPS hiệu năng cao 160.191.51.55.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
