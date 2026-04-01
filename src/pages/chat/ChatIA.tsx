import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Settings, User, Loader2, AlertCircle } from 'lucide-react';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

const DEFAULT_SYSTEM_PROMPT =
  'Você é o assistente virtual Go Win Pro. Responda de forma sucinta e profissional baseando-se no contexto das empresas.';

const INITIAL_MESSAGE: Message = {
  id: 'init',
  role: 'assistant',
  content:
    'Olá! Eu sou o assistente virtual Go Win Pro. Estou conectado ao seu banco de dados de empresas e compromissos. Como posso ajudar com suas visitas hoje?',
};

export default function ChatIA() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    if (!apiKey) {
      setError('Chave da API não configurada. Adicione VITE_ANTHROPIC_API_KEY no arquivo .env');
      return;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-allow-browser': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: updatedMessages
            .filter((m) => m.id !== 'init')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `Erro ${response.status}`);
      }

      const data = await response.json() as { content: Array<{ type: string; text: string }> };
      const replyText = data.content.find((c) => c.type === 'text')?.text ?? '';
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: replyText },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com a IA. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Assistente IA</h1>
          <p className="text-sm text-slate-500 mt-1">Inteligência Artificial conectada aos processos da empresa</p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 pb-6 overflow-hidden max-h-[calc(100vh-140px)]">
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 p-4 flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-brand-600" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Go Win Assistant</h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs text-slate-500">Online</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
            {messages.map((msg) =>
              msg.role === 'assistant' ? (
                <div key={msg.id} className="flex gap-4">
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm max-w-[85%] rounded-tl-none">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-4 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div className="bg-brand-600 rounded-2xl p-4 shadow-sm max-w-[85%] rounded-tr-none">
                    <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ),
            )}
            {isLoading && (
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-brand-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm rounded-tl-none">
                  <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200">
            <div className="relative flex items-center w-full">
              <input
                type="text"
                placeholder="Pergunte algo ao assistente..."
                className="block w-full rounded-full border-0 py-3 pl-4 pr-14 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6 transition-all"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 p-2 rounded-full bg-brand-600 text-white hover:bg-brand-500 transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-80 flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
              <Settings className="h-5 w-5 text-slate-500" />
              <h3 className="font-semibold text-slate-900">Contexto do Assistente</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Defina as instruções de negócio (System Prompt) que a IA usará antes de responder às perguntas.
            </p>
            <textarea
              className="w-full h-40 mt-1 block rounded-lg border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6"
              placeholder="Ex: Você é um assistente de vendas focado em..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <button
              onClick={() => setMessages([INITIAL_MESSAGE])}
              className="w-full mt-4 inline-flex justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Salvar Contexto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
