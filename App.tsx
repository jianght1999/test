
import React, { useState, useEffect } from 'react';
import { geminiService } from './services/geminiService';
import { Message, ImageData, AnalysisResult } from './types';
import ChatWindow from './components/ChatWindow';

// 注意：不要使用 import 导入图片文件，因为这在浏览器 ESM 环境下会被当作脚本解析导致崩溃。
// 我们直接使用文件路径字符串。
const DEFAULT_IMAGE_PATH = './photo.jpg'; // 根据 metadata.json，优先尝试 photo.jpg

const App: React.FC = () => {
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const loadDefaultImage = async () => {
      setIsAnalyzing(true);
      try {
        // 尝试加载图片文件
        const response = await fetch(DEFAULT_IMAGE_PATH);
        
        // 如果 photo.jpg 没找到，尝试 cover.jpg
        let finalResponse = response;
        let finalPath = DEFAULT_IMAGE_PATH;
        
        if (!response.ok) {
          const backupResponse = await fetch('./cover.jpg');
          if (backupResponse.ok) {
            finalResponse = backupResponse;
            finalPath = './cover.jpg';
          } else {
            throw new Error("未找到预设图片文件");
          }
        }
        
        const blob = await finalResponse.blob();
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const imgData: ImageData = {
            base64,
            mimeType: blob.type,
            previewUrl: finalPath
          };
          setCurrentImage(imgData);
          await performAnalysis(imgData);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.warn("自动索引跳过: 请手动上传图片以开始。", err);
        setInitError("未找到预设图片，请手动上传。");
        setIsAnalyzing(false);
      }
    };
    
    loadDefaultImage();
  }, []);

  const performAnalysis = async (imgData: ImageData) => {
    setIsAnalyzing(true);
    setInitError(null);
    try {
      const result = await geminiService.analyzeImage(imgData);
      setAnalysis(result);
      setMessages([{
        role: 'assistant',
        content: `✨ 视觉索引成功！\n这是一张：${result.summary}\n你可以问我关于这张图的任何细节。`,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setMessages([{
        role: 'assistant',
        content: "图片已加载，但 AI 分析遇到问题（请检查 API Key）。你仍然可以尝试与我交流。",
        timestamp: new Date()
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentImage) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsAnalyzing(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await geminiService.chatAboutImage(currentImage, text, history);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "抱歉，分析过程中出现了点问题。请检查网络或 API 配置。",
        timestamp: new Date()
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const imgData = {
        base64,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      };
      setCurrentImage(imgData);
      performAnalysis(imgData);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
      {/* 左侧：图片展示区 */}
      <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="relative z-10 w-full max-w-3xl">
          <div className="bg-white/[0.02] p-2 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-3xl group">
            <div className="relative overflow-hidden rounded-[32px] aspect-[16/10] bg-black/40 flex items-center justify-center">
              {currentImage ? (
                <img 
                  src={currentImage.previewUrl} 
                  className="w-full h-full object-contain transition-all duration-1000 group-hover:scale-105"
                  alt="Index Target"
                />
              ) : (
                <label className="flex flex-col items-center gap-6 cursor-pointer hover:bg-white/5 w-full h-full justify-center transition-all duration-500">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all">
                    <i className="fa-solid fa-plus text-2xl text-white/20 group-hover:text-blue-400"></i>
                  </div>
                  <div className="text-center">
                    <p className="text-white/40 text-sm tracking-[0.2em] uppercase mb-2">等待图片输入</p>
                    <p className="text-white/10 text-[10px] uppercase">支持 JPG, PNG, WEBP</p>
                  </div>
                  <input type="file" className="hidden" onChange={onManualUpload} accept="image/*" />
                </label>
              )}
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-blue-500/20 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-blue-400 text-xs font-medium tracking-[0.5em] uppercase animate-pulse">核心特征提取中</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {analysis?.tags.map((tag, i) => (
              <span key={i} className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 tracking-wider uppercase backdrop-blur-md">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：对话区 */}
      <div className="w-full md:w-[500px] bg-[#080808]/80 backdrop-blur-3xl border-l border-white/5 flex flex-col p-6 md:p-10">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <i className="fa-solid fa-brain text-sm"></i>
            </div>
            <div>
              <h1 className="text-xl font-medium">视觉分析引擎</h1>
              <p className="text-white/20 text-[9px] uppercase tracking-[0.3em]">Advanced Neural Indexing</p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <ChatWindow 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isLoading={isAnalyzing} 
          />
        </div>

        <footer className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
          <label className="group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <i className="fa-solid fa-camera text-xs text-white/30 group-hover:text-white/60"></i>
              </div>
              <span className="text-[10px] text-white/30 uppercase tracking-widest group-hover:text-white/60">更换分析对象</span>
            </div>
            <input type="file" className="hidden" onChange={onManualUpload} accept="image/*" />
          </label>
        </footer>
      </div>
    </div>
  );
};

export default App;
