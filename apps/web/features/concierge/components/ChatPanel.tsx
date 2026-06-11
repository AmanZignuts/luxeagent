import React, { FormEvent, RefObject } from "react";
import { QUICK_PROMPTS } from "../types";

function getToolResultChip(result: {
  type: string;
  products?: unknown[];
  title?: string;
  occasion?: string;
  orders?: unknown[];
  item?: { title?: string };
  empty?: boolean;
  emptyMessage?: string;
  appliedFilters?: { label?: string };
  look?: unknown[];
  totalPrice?: number;
  totalBudgetMax?: number | null;
}): { title: string; subtitle: string } {
  switch (result.type) {
    case "product_carousel":
      if (result.empty || (result.products?.length ?? 0) === 0) {
        return {
          title: "No exact matches",
          subtitle: result.emptyMessage ?? "Adjust filters in the styling panel",
        };
      }
      return {
        title: `${result.products?.length ?? 0} pieces curated`,
        subtitle: result.appliedFilters?.label
          ? `Filtered: ${result.appliedFilters.label}`
          : "Browse your edit in the styling panel",
      };
    case "personalized_carousel":
      return {
        title: `${result.products?.length ?? 0} picks for you`,
        subtitle: "Personalized selection is ready to view",
      };
    case "size_picker":
      return {
        title: result.title ? `Sizing · ${result.title}` : "Size & stock",
        subtitle: "Availability shown in the styling panel",
      };
    case "lookbook":
      return {
        title: result.occasion ? `${result.occasion} look` : "Look staged",
        subtitle: "Full lookbook is in the styling panel",
      };
    case "outfit_builder":
      if (result.empty || (result.look?.length ?? 0) === 0) {
        return {
          title: "No outfit in budget",
          subtitle: result.emptyMessage ?? "Adjust budget in the styling panel",
        };
      }
      return {
        title: result.occasion ? `Outfit · ${result.occasion}` : "Outfit built",
        subtitle:
          result.totalBudgetMax != null
            ? `₹${result.totalPrice ?? 0} of ₹${result.totalBudgetMax} max`
            : "Head-to-toe edit ready to explore",
      };
    case "product_comparison":
      return {
        title: "Comparison ready",
        subtitle: "Side-by-side view in the styling panel",
      };
    case "image_search_result":
      return {
        title: "Visual matches found",
        subtitle: "Similar pieces in the styling panel",
      };
    case "occasion_recommendation":
      return {
        title: result.occasion ? `${result.occasion} edit` : "Occasion picks",
        subtitle: "Curated for your moment",
      };
    case "order_status":
      return {
        title: `${result.orders?.length ?? 0} order${(result.orders?.length ?? 0) === 1 ? "" : "s"}`,
        subtitle: "Purchase history in the styling panel",
      };
    case "style_profile":
      return {
        title: "Style profile",
        subtitle: "Your preferences are loaded",
      };
    case "add_to_bag_confirm":
      return {
        title: result.item?.title ? `Added · ${result.item.title}` : "Added to bag",
        subtitle: "Open your bag anytime from the header",
      };
    default:
      return { title: "Ready", subtitle: "View in the styling panel" };
  }
}

function parseMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface ChatPanelProps {
  messages: any[];
  isLoading: boolean;
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e: FormEvent) => void;
  sendUserQuery: (text: string) => void;
  apiError: string | null;
  chatEndRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  imagePreview: string | null;
  onClearImage: () => void;
  onImageFileSelect: (file: File) => void;
}

export function ChatPanel({
  messages,
  isLoading,
  input,
  setInput,
  handleSubmit,
  sendUserQuery,
  apiError,
  chatEndRef,
  fileInputRef,
  imagePreview,
  onClearImage,
  onImageFileSelect,
}: ChatPanelProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const dropZoneRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      if (input === "") {
        textarea.style.height = "auto";
        textarea.style.overflowY = "hidden";
      } else {
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = Math.min(scrollHeight, 96) + "px";
        textarea.style.overflowY = scrollHeight > 96 ? "auto" : "hidden";
      }
    }
  }, [input]);

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onImageFileSelect(file);
  }, [onImageFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 border-r border-muted-zinc bg-surface-white min-h-0 relative transition-colors ${
        isDragOver ? "bg-warm-linen/30" : ""
      }`}
    >
      {isDragOver && (
        <div className="absolute inset-0 bg-surface-white/95 backdrop-blur-[2px] border-2 border-dashed border-obsidian-velvet/30 m-3 rounded-2xl flex flex-col items-center justify-center gap-2 z-[200] pointer-events-none animate-in fade-in duration-200">
          <svg className="w-8 h-8 text-obsidian-velvet/40 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-obsidian-velvet/60">
            Drop image to upload
          </p>
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 min-h-0">
        {messages.map((message: any) => {
          const text = message.content ||
            message.parts
              ?.filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("") || "";
          const hasToolParts = message.parts?.some(
            (p: any) => p.type === "dynamic-tool" || p.type?.startsWith("tool-")
          );

          return (
            <div key={message.id} className="space-y-2.5">
              {/* Text bubble */}
              {text && (
                <div className={`space-y-1 max-w-[88%] ${message.role === "user" ? "ml-auto" : ""}`}>
                  <span className={`font-sans font-bold tracking-widest text-[7px] uppercase block ${message.role === "user" ? "text-right text-obsidian-velvet/30" : "text-obsidian-velvet/30"}`}>
                    {message.role === "assistant" ? "AI Concierge" : "You"}
                  </span>
                  <div
                    className={`px-4 py-3 rounded-2xl font-sans text-[11.5px] leading-relaxed whitespace-pre-wrap ${
                      message.role === "assistant"
                        ? "bg-warm-linen/60 text-obsidian-velvet/90 rounded-tl-sm"
                        : "bg-obsidian-velvet text-surface-white rounded-tr-sm ml-auto"
                    }`}
                  >
                    {parseMarkdown(text)}
                  </div>
                </div>
              )}

              {/* Tool loading hint */}
              {hasToolParts && message.parts?.map((part: any, idx: number) => {
                if (!part.type?.startsWith("tool-") && part.type !== "dynamic-tool") return null;
                if (part.state === "output-available" || part.state === "done") {
                  const result = part.output;
                  if (!result) return null;
                  const chip = getToolResultChip(result);
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 pl-2.5 pr-3 py-2.5 bg-surface-white/90 border border-muted-zinc/50 rounded-xl max-w-[92%]"
                    >
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-tint-champagne text-[10px] text-obsidian-velvet/70">
                        ✓
                      </span>
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] font-semibold text-obsidian-velvet leading-snug">
                          {chip.title}
                        </p>
                        <p className="font-sans text-[9px] text-obsidian-velvet/45 mt-0.5 leading-relaxed">
                          {chip.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                }
                // Loading
                return (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 text-[9px] font-sans font-bold text-obsidian-velvet/40 uppercase tracking-wider">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/30 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/30 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/30 animate-bounce [animation-delay:300ms]" />
                    </div>
                    Curating...
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Streaming indicator */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 px-4 py-3 bg-warm-linen/60 rounded-2xl rounded-tl-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/40 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/40 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-obsidian-velvet/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex-shrink-0 px-4 pt-3 pb-0">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setInput(p.query);
                sendUserQuery(p.query);
                setInput("");
              }}
              disabled={isLoading}
              className="flex-shrink-0 bg-warm-linen border border-muted-zinc/80 hover:border-obsidian-velvet hover:bg-tint-champagne/40 text-obsidian-velvet/70 font-sans font-bold text-[8px] uppercase tracking-wider px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="flex-shrink-0 px-4 py-2 bg-surface-white border-t border-muted-zinc/60 animate-in slide-in-from-bottom duration-200">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="w-16 h-20 object-cover rounded-lg border border-muted-zinc shadow-sm"
            />
            <button
              type="button"
              onClick={onClearImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-obsidian-velvet text-surface-white rounded-full flex items-center justify-center text-[10px] cursor-pointer hover:bg-obsidian-velvet/80 transition-colors border-none"
            >
              ✕
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-obsidian-velvet/70 text-surface-white text-[6px] font-bold uppercase tracking-wider py-0.5 rounded-b-lg text-center">
              Visual Search
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-muted-zinc/60 p-4 bg-surface-white">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-9 h-9 border border-muted-zinc hover:border-obsidian-velvet text-obsidian-velvet/50 hover:text-obsidian-velvet flex items-center justify-center rounded-xl transition-all cursor-pointer bg-warm-linen/40"
            title="Upload image for visual search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageFileSelect(file);
              e.target.value = "";
            }}
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              maxLength={500}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              disabled={!!apiError}
              placeholder={apiError ? "API Error: Please resolve" : "Describe what you're looking for... (or drag an image)"}
              rows={1}
              className="w-full bg-warm-linen/40 border border-muted-zinc focus:border-obsidian-velvet rounded-xl pl-4 pr-4 py-2.5 text-[11.5px] font-sans text-obsidian-velvet placeholder-obsidian-velvet/30 focus:outline-none transition-all resize-none overflow-hidden scrollbar-thin leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !imagePreview) || !!apiError}
            className="flex-shrink-0 w-9 h-9 bg-obsidian-velvet text-surface-white flex items-center justify-center rounded-xl hover:bg-obsidian-velvet/90 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </form>
        <div className="relative flex justify-center items-center mt-2 select-none">
          <span className="font-sans text-[7.5px] text-obsidian-velvet/25 uppercase tracking-widest text-center">
            Shift+Enter for new line · Drag image for visual search
          </span>
          <span className={`absolute right-0 font-sans text-[8px] tracking-wider uppercase font-semibold transition-colors duration-200 ${input.length >= 450 ? 'text-red-500 font-bold' : 'text-obsidian-velvet/30'}`}>
            {input.length} / 500
          </span>
        </div>
      </div>
    </div>
  );
}
