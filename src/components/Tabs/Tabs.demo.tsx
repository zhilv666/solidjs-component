import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { Input } from "../Input";
import { Tabs } from "./Tabs";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["outline", "ghost"] as const;

export function TabsDemo() {
  const [value, setValue] = createSignal("account");
  const [changes, setChanges] = createSignal(0);
  const [name, setName] = createSignal("SolidJS");
  const [manual, setManual] = createSignal(false);
  const [vertical, setVertical] = createSignal(false);
  const [disabled, setDisabled] = createSignal(false);
  return (
    <div class="space-y-8">
      <AppearancePreview id="tabs">
        {(appearance, size) => (
          <div class="space-y-6">
            <For each={variants}>
              {(variant) => {
                const id = `tabs-${appearance}-${variant}-${size}`;
                return (
                  <div class="space-y-2">
                    <p class="text-md text-fg-muted">
                      {variant} · {size}
                    </p>
                    <Tabs
                      id={id}
                      appearance={appearance}
                      size={size}
                      variant={variant}
                      defaultValue="overview"
                    >
                      <Tabs.List
                        aria-label={`${appearance} ${variant} ${size}`}
                      >
                        <Tabs.Trigger value="overview">概览</Tabs.Trigger>
                        <Tabs.Trigger value="disabled" disabled>
                          禁用
                        </Tabs.Trigger>
                        <Tabs.Trigger value="settings">设置</Tabs.Trigger>
                      </Tabs.List>
                      <Tabs.Content value="overview">
                        概览面板 · {appearance}
                      </Tabs.Content>
                      <Tabs.Content value="disabled">禁用面板</Tabs.Content>
                      <Tabs.Content value="settings">
                        设置面板 · {size}
                      </Tabs.Content>
                    </Tabs>
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Tab
        进入当前标签，再进入面板；左右方向键切换横向标签，上下方向键切换纵向标签，
        Home/End
        跳到首尾并跳过禁用项。自动模式聚焦即激活；手动模式先移动焦点，再用 Enter
        或空格激活。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="tabs-live-heading"
      >
        <h3 id="tabs-live-heading" class="text-md font-medium">
          受控值、纵向与手动激活
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            id="tabs-toggle-manual"
            variant="outline"
            aria-pressed={manual()}
            onClick={() => setManual((current) => !current)}
          >
            {manual() ? "手动激活" : "自动激活"}
          </Button>
          <Button
            id="tabs-toggle-vertical"
            variant="outline"
            aria-pressed={vertical()}
            onClick={() => setVertical((current) => !current)}
          >
            {vertical() ? "纵向" : "横向"}
          </Button>
          <Button
            id="tabs-toggle-disabled"
            variant="ghost"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用标签组" : "禁用标签组"}
          </Button>
        </div>
        <Tabs
          id="tabs-live"
          appearance="mahjong"
          value={value()}
          onValueChange={(next) => {
            setValue(next);
            setChanges((current) => current + 1);
          }}
          orientation={vertical() ? "vertical" : "horizontal"}
          activationMode={manual() ? "manual" : "automatic"}
          disabled={disabled()}
        >
          <Tabs.List aria-label="账户设置">
            <Tabs.Trigger value="account">账户</Tabs.Trigger>
            <Tabs.Trigger value="disabled" disabled>
              禁用
            </Tabs.Trigger>
            <Tabs.Trigger value="security">安全</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="account" forceMount>
            <div class="space-y-3">
              <label for="tabs-name" class="block text-md font-medium">
                账户昵称
              </label>
              <Input
                id="tabs-name"
                value={name()}
                onValueChange={setName}
                appearance="mahjong"
              />
              <p class="text-md text-fg-muted">
                forceMount 保留输入节点；非活动面板隐藏且不参与 Tab。
              </p>
            </div>
          </Tabs.Content>
          <Tabs.Content value="disabled">禁用内容</Tabs.Content>
          <Tabs.Content value="security" forceMount>
            <p class="text-md text-fg-muted">
              纯文字面板由 Kobalte 提供可聚焦的入口。
            </p>
          </Tabs.Content>
        </Tabs>
        <output
          id="tabs-live-status"
          class="text-md text-fg-muted"
          aria-live="polite"
        >
          当前 {value()}；切换 {changes()} 次；昵称 {name()}
        </output>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="tabs-disabled-heading"
      >
        <h3 id="tabs-disabled-heading" class="text-md font-medium">
          整组禁用与默认首个可用标签
        </h3>
        <Tabs
          id="tabs-all-disabled"
          appearance="keycap"
          disabled
          defaultValue="a"
        >
          <Tabs.List aria-label="整组禁用">
            <Tabs.Trigger value="a">项目 A</Tabs.Trigger>
            <Tabs.Trigger value="b">项目 B</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">
            禁用的是标签导航；面板保留可读内容。
          </Tabs.Content>
        </Tabs>
        <p class="text-md text-fg-muted">
          下面的标签组未显式设置外观，跟随右上角的全局外观选择。
        </p>
        <Tabs id="tabs-auto">
          <Tabs.List aria-label="自动默认值">
            <Tabs.Trigger value="disabled" disabled>
              禁用首项
            </Tabs.Trigger>
            <Tabs.Trigger value="a">第一个可用项</Tabs.Trigger>
            <Tabs.Trigger value="b">第二个可用项</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="a">
            未指定 defaultValue 时，Kobalte 选择首个可用标签。
          </Tabs.Content>
          <Tabs.Content value="b">第二个面板。</Tabs.Content>
        </Tabs>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="tabs-long-heading"
      >
        <h3 id="tabs-long-heading" class="text-md font-medium">
          长标签、原生属性与窄屏换行
        </h3>
        <Tabs
          id="tabs-long"
          appearance="keycap"
          size="lg"
          defaultValue="long"
          title="Native title"
          class="w-full"
        >
          <Tabs.List aria-label="长标签">
            <Tabs.Trigger value="long" class="text-left" title="Native trigger">
              VeryLongUnbrokenTabLabelForNarrowScreenWithoutHorizontalOverflow
            </Tabs.Trigger>
            <Tabs.Trigger value="short">短标签</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="long">
            VeryLongUnbrokenPanelContentForNarrowScreenWithoutHorizontalOverflow.
          </Tabs.Content>
          <Tabs.Content value="short">短内容。</Tabs.Content>
        </Tabs>
      </section>
    </div>
  );
}
