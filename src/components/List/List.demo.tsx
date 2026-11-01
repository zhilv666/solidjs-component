import { createMemo, createSignal, For } from "solid-js";
import { List, type ListItem } from "./List";
import { Button } from "../Button";
import { AppearancePreview } from "../../demo/AppearancePreview";
import { NavigationIcon } from "../../demo/NavigationIcon";

const variants = ["outline", "plain"] as const;
const entries: readonly ListItem[] = [
  { value: "alpha", label: "Alpha", description: "项目概览 / Overview" },
  {
    value: "disabled",
    label: "Disabled",
    description: "禁用项目",
    disabled: true,
  },
  { value: "beta", label: "Beta", description: "团队设置 / Team" },
  { value: "gamma", label: "Gamma", description: "通知偏好 / Notifications" },
];

export function ListDemo() {
  const [single, setSingle] = createSignal<string[]>(["alpha"]);
  const [multiple, setMultiple] = createSignal<string[]>(["alpha"]);
  const [disabled, setDisabled] = createSignal(false);
  const [reversed, setReversed] = createSignal(false);
  const [changes, setChanges] = createSignal(0);
  const [action, setAction] = createSignal("尚未操作");
  const items = createMemo(() =>
    reversed() ? [...entries].reverse() : entries,
  );
  const displayItems: readonly ListItem[] = entries.map((item) => ({
    ...item,
    get icon() {
      return <NavigationIcon name="files" />;
    },
  }));

  return (
    <div class="space-y-8">
      <AppearancePreview id="list">
        {(appearance, size) => (
          <div class="space-y-5">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <List
                    id={`list-${appearance}-${variant}-${size}`}
                    appearance={appearance}
                    size={size}
                    variant={variant}
                    selectionMode="multiple"
                    defaultValue={["alpha"]}
                    items={entries.slice(0, 3)}
                    aria-label={`${appearance} ${variant} ${size}`}
                  />
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>

      <section class="space-y-4" aria-labelledby="list-live-heading">
        <h3 id="list-live-heading" class="text-md font-medium">
          选择与键盘导航
        </h3>
        <p class="text-md text-fg-muted">
          Tab 进入列表；方向键、Home/End
          与首字母定位跳过禁用项。单选方向键同步选择；首字母只定位焦点，可再用空格或
          Enter 选择。多选用空格或 Enter 切换，Ctrl+A
          选择所有可用项。受控空数组保持空选择。
          列表不提供原生表单字段，可由调用方将选中键提交。
        </p>
        <div class="flex flex-wrap gap-3">
          <Button
            id="list-toggle-disabled"
            variant="outline"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用列表" : "禁用列表"}
          </Button>
          <Button
            id="list-toggle-order"
            variant="ghost"
            aria-pressed={reversed()}
            onClick={() => setReversed((current) => !current)}
          >
            {reversed() ? "恢复顺序" : "反转项目顺序"}
          </Button>
          <Button
            id="list-clear"
            variant="ghost"
            onClick={() => {
              setSingle([]);
              setMultiple([]);
            }}
          >
            清空选择
          </Button>
        </div>
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-2">
            <h4 class="text-md font-medium">受控单选（跟随全局外观）</h4>
            <List
              id="list-single"
              selectionMode="single"
              items={items()}
              value={single()}
              disabled={disabled()}
              onValueChange={(next) => {
                setSingle(next);
                setChanges((current) => current + 1);
              }}
              aria-label="受控单选"
            />
          </div>
          <div class="space-y-2">
            <h4 class="text-md font-medium">受控多选</h4>
            <List
              id="list-multiple"
              appearance="mahjong"
              selectionMode="multiple"
              items={items()}
              value={multiple()}
              disabled={disabled()}
              onValueChange={(next) => {
                setMultiple(next);
                setChanges((current) => current + 1);
              }}
              aria-label="受控多选"
            />
          </div>
        </div>
        <output
          id="list-live-status"
          class="block text-md text-fg-muted"
          aria-live="polite"
        >
          单选 {single().join(", ") || "空"}；多选{" "}
          {multiple().join(", ") || "空"}；请求 {changes()} 次
        </output>
        <List
          id="list-fixed"
          selectionMode="single"
          items={entries}
          value={[]}
          onValueChange={() => setChanges((current) => current + 1)}
          aria-label="固定空选择"
        />
      </section>

      <section class="space-y-4" aria-labelledby="list-display-heading">
        <h3 id="list-display-heading" class="text-md font-medium">
          展示列表、图标与操作插槽
        </h3>
        <p class="text-md text-fg-muted">
          只有操作按钮参与 Tab，列表外框不模拟按钮。
        </p>
        <List
          id="list-display"
          items={displayItems}
          title="Native list"
          class="w-full"
          aria-label="项目操作"
          renderAction={(item) => (
            <Button
              size="sm"
              variant="outline"
              disabled={item.disabled}
              aria-label={`查看 ${item.label}`}
              onClick={() => setAction(`查看 ${item.label}`)}
            >
              查看
            </Button>
          )}
        />
        <output
          id="list-action-status"
          class="text-md text-fg-muted"
          aria-live="polite"
        >
          {action()}
        </output>
      </section>

      <section class="space-y-4" aria-labelledby="list-empty-heading">
        <h3 id="list-empty-heading" class="text-md font-medium">
          空态与长内容
        </h3>
        <List
          id="list-empty"
          items={[]}
          emptyContent="还没有项目，可稍后添加。"
          aria-label="空展示列表"
        />
        <List
          id="list-empty-selectable"
          selectionMode="multiple"
          items={[]}
          aria-label="空选择列表"
        />
        <List
          id="list-long"
          selectionMode="single"
          items={[
            {
              value: "long",
              label:
                "VeryLongUnbrokenListLabelForNarrowScreensWithoutHorizontalOverflow",
              description:
                "LongUnbrokenDescriptionMustWrapWithoutChangingTheAccessibleName",
            },
          ]}
          aria-label="长内容选择列表"
        />
      </section>
    </div>
  );
}
