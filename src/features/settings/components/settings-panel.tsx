"use client";

import { cn } from "@/lib/utils/cn";
import { useStudio } from "@/features/chat/store/studio-store";
import { modelOptions } from "../model/options";

type SettingsPanelProps = {
  className?: string;
};

type SliderProps = {
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
};

function SettingSlider({ label, hint, min, max, step, value, onChange }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-studio-text">
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs text-studio-muted">{hint}</div>
        </div>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-20 rounded-xl border border-studio-border/70 bg-studio-panel-2/80 px-2 py-1 text-xs text-studio-text outline-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-studio-border/70 accent-studio-accent"
      />
    </div>
  );
}

export default function SettingsPanel({ className }: SettingsPanelProps) {
  const { state, actions } = useStudio();
  const { settings } = state;

  return (
    <aside
      className={cn(
        "flex h-full min-h-[320px] flex-col gap-4 rounded-3xl border border-studio-border/80 bg-studio-panel/85 p-4 shadow-[0_25px_70px_rgba(5,7,10,0.45)] backdrop-blur animate-[float-in_0.8s_ease]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-studio-muted">Run settings</p>
          <h3 className="text-lg font-semibold text-studio-text">模型配置</h3>
        </div>
        <span className="rounded-full border border-studio-border/70 px-3 py-1 text-xs text-studio-muted">
          OpenRouter
        </span>
      </div>

      <div className="rounded-2xl border border-studio-border/70 bg-studio-panel-2/70 p-3">
        <div className="text-xs uppercase tracking-[0.2em] text-studio-muted">Model</div>
        <select
          value={settings.model}
          onChange={(event) => actions.updateSettings({ model: event.target.value })}
          className="mt-2 w-full rounded-xl border border-studio-border/70 bg-studio-panel px-3 py-2 text-sm text-studio-text outline-none"
        >
          {modelOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-studio-muted">
          {modelOptions.find((option) => option.id === settings.model)?.description ??
            "选择一个适合当前任务的模型。"}
        </p>
      </div>

      <div className="rounded-2xl border border-studio-border/70 bg-studio-panel-2/70 p-3">
        <div className="text-xs uppercase tracking-[0.2em] text-studio-muted">
          System instructions
        </div>
        <textarea
          value={settings.systemPrompt}
          onChange={(event) => actions.updateSettings({ systemPrompt: event.target.value })}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-studio-border/70 bg-studio-panel px-3 py-2 text-xs leading-6 text-studio-text outline-none"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-studio-border/70 bg-studio-panel-2/70 p-3">
        <SettingSlider
          label="Temperature"
          hint="控制输出随机性"
          min={0}
          max={1.5}
          step={0.05}
          value={settings.temperature}
          onChange={(value) => actions.updateSettings({ temperature: value })}
        />
        <SettingSlider
          label="Top P"
          hint="截断采样概率"
          min={0}
          max={1}
          step={0.05}
          value={settings.topP}
          onChange={(value) => actions.updateSettings({ topP: value })}
        />
        <SettingSlider
          label="Presence penalty"
          hint="增加新话题倾向"
          min={-2}
          max={2}
          step={0.1}
          value={settings.presencePenalty}
          onChange={(value) => actions.updateSettings({ presencePenalty: value })}
        />
        <SettingSlider
          label="Frequency penalty"
          hint="降低重复内容"
          min={-2}
          max={2}
          step={0.1}
          value={settings.frequencyPenalty}
          onChange={(value) => actions.updateSettings({ frequencyPenalty: value })}
        />
        <SettingSlider
          label="Max tokens"
          hint="单次输出最大长度"
          min={128}
          max={8192}
          step={128}
          value={settings.maxTokens}
          onChange={(value) => actions.updateSettings({ maxTokens: value })}
        />
      </div>

      <div className="rounded-2xl border border-studio-border/70 bg-studio-panel-2/70 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-studio-text">Streaming</div>
            <div className="text-xs text-studio-muted">开启流式输出</div>
          </div>
          <button
            type="button"
            onClick={() => actions.updateSettings({ stream: !settings.stream })}
            className={cn(
              "relative h-6 w-11 rounded-full border transition",
              settings.stream
                ? "border-studio-accent/70 bg-studio-accent/30"
                : "border-studio-border/70 bg-studio-panel",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition",
                settings.stream
                  ? "left-5 bg-studio-accent"
                  : "left-1 bg-studio-muted",
              )}
            />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-studio-border/70 bg-studio-panel-2/70 p-3 text-xs text-studio-muted">
        API Key 通过服务器环境变量 <span className="text-studio-text">OPENROUTER_API_KEY</span>{" "}
        配置。设置后即可在此页面直接调用模型。
      </div>
    </aside>
  );
}
