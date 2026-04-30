import { HighlightedFeature } from "./components/HighlightedFeature";

export function AIReady() {
  return (
    <HighlightedFeature
      name="AI conversations that feel human"
      description="Golden Voices uses advanced AI to have natural, warm conversations with your loved ones. The AI speaks their language — English, Urdu, or Hindi — and adapts to their pace of speech. After each call, you receive a detailed summary of how they're doing, what they talked about, and any health concerns that came up."
      highlightedComponent={<GVCallExample />}
      direction="row-reverse"
    />
  );
}

function GVCallExample() {
  return (
    <div className="w-full rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 font-mono text-sm dark:from-amber-950/30 dark:to-orange-950/30">
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
        AI Call in progress — Urdu
      </div>
      <div className="space-y-2">
        <div className="flex gap-3">
          <span className="text-amber-600">AI:</span>
          <span>"Assalam o Alaikum! Kaise hain aap? Aaj ka din kaisa guzra?"</span>
        </div>
        <div className="flex gap-3">
          <span className="text-blue-600">Senior:</span>
          <span>"Walaikum Assalam! Main theek hoon, shukriya. Aaj subah baarish thi."</span>
        </div>
        <div className="flex gap-3">
          <span className="text-amber-600">AI:</span>
          <span>"Accha, baarish mein kya kiya aaj subah? Khaana khaya aap?"</span>
        </div>
      </div>
      <div className="mt-4 rounded bg-white/60 p-3 text-xs dark:bg-white/10">
        <strong>Call Summary:</strong> Senior seems in good spirits. Mentioned rain in the morning. No health concerns flagged.
      </div>
    </div>
  );
}
