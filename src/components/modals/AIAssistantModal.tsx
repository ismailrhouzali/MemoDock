import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  ListOrdered,
  SpellCheck,
  RefreshCw,
  Lightbulb,
  Languages,
  BookOpen,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { AppSettings, Note } from '../../db/types';
import { executeAIRequest, AIAction } from '../../services/aiService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote: Note;
  settings: AppSettings;
  onInsertContent: (content: string) => void;
  onOpenSettings: () => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  activeNote,
  settings,
  onInsertContent,
  onOpenSettings,
}) => {
  const [action, setAction] = useState<AIAction>('summarize');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [customPrompt, setCustomPrompt] = useState('');
  const [resultText, setResultText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRun = async () => {
    setError(null);
    setIsLoading(true);
    setResultText('');

    try {
      const textToProcess = activeNote.plainText || activeNote.title;
      if (!textToProcess.trim()) {
        throw new Error('Current note has no content to process.');
      }

      const output = await executeAIRequest(
        {
          action,
          text: textToProcess,
          targetLanguage: targetLang,
          customInstruction: customPrompt,
        },
        settings
      );

      setResultText(output);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete AI request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInsert = () => {
    if (resultText) {
      onInsertContent(`\n\n<blockquote><p><strong>AI ${action.toUpperCase()}:</strong><br/>${resultText.replace(/\n/g, '<br/>')}</p></blockquote>\n\n`);
      onClose();
    }
  };

  const actionList: { id: AIAction; label: string; icon: React.ReactNode }[] = [
    { id: 'summarize', label: 'Summarize Note', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'grammar', label: 'Fix Grammar & Spelling', icon: <SpellCheck className="w-3.5 h-3.5" /> },
    { id: 'rewrite', label: 'Rewrite & Polish', icon: <RefreshCw className="w-3.5 h-3.5" /> },
    { id: 'bullets', label: 'Extract Key Bullets', icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: 'ideas', label: 'Brainstorm Ideas', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'explain', label: 'Explain Concepts', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'translate', label: 'Translate', icon: <Languages className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Writing Copilot</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
          {/* Missing Key Warning */}
          {!settings.aiApiKey && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>No API Key configured. Add your key to enable AI features.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium whitespace-nowrap transition"
              >
                Open Settings
              </button>
            </div>
          )}

          {/* Action pills */}
          <div>
            <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Select Action
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {actionList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAction(item.id)}
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 transition ${
                    action === item.id
                      ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-stone-900 dark:text-stone-100 font-semibold'
                      : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-stone-600 dark:text-zinc-400'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target language if translate */}
          {action === 'translate' && (
            <div>
              <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Target Language
              </label>
              <input
                type="text"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                placeholder="e.g. French, German, Japanese, Spanish"
                className="w-full px-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          {/* Custom prompt instructions */}
          <div>
            <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Additional Instruction (Optional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Keep it under 3 sentences, use a casual tone..."
              className="w-full px-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Run Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRun}
              disabled={isLoading || !settings.aiApiKey}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-lg disabled:opacity-40 transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Output Display */}
          {resultText && (
            <div className="space-y-2 pt-2 border-t border-stone-200/60 dark:border-zinc-800/60">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  AI Result:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded text-stone-500 flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleInsert}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-[11px] flex items-center gap-1 transition"
                  >
                    <span>Append to Note</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-zinc-950 rounded-lg border border-stone-200 dark:border-zinc-800 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed text-stone-800 dark:text-stone-200">
                {resultText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

