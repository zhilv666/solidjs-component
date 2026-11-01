import { createSignal, For } from "solid-js";
import { Button } from "../Button";
import { DropdownMenu } from "./DropdownMenu";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["outline", "ghost"] as const;
const states = [
  { id: "enabled", label: "打开", disabled: false },
  { id: "disabled", label: "禁用", disabled: true },
] as const;
function MenuItems(props: { id: string; onAction?: (action: string) => void }) {
  return (
    <>
      <DropdownMenu.Group>
        <DropdownMenu.GroupLabel id={`${props.id}-group-label`}>
          文件操作
        </DropdownMenu.GroupLabel>
        <DropdownMenu.Item
          id={`${props.id}-first`}
          textValue="Alpha"
          onSelect={() => props.onAction?.("新建")}
        >
          <div class="min-w-0 space-y-1">
            <DropdownMenu.ItemLabel id={`${props.id}-first-label`}>
              新建
            </DropdownMenu.ItemLabel>
            <DropdownMenu.ItemDescription id={`${props.id}-first-description`}>
              创建一个空白项目
            </DropdownMenu.ItemDescription>
          </div>
        </DropdownMenu.Item>
        <DropdownMenu.Item id={`${props.id}-disabled`} disabled>
          禁用操作
        </DropdownMenu.Item>
        <DropdownMenu.Item
          id={`${props.id}-danger`}
          variant="danger"
          textValue="Delete"
          onSelect={() => props.onAction?.("删除")}
        >
          <DropdownMenu.ItemLabel>删除</DropdownMenu.ItemLabel>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.CheckboxItem id={`${props.id}-check`} defaultChecked>
        <DropdownMenu.ItemLabel>显示网格</DropdownMenu.ItemLabel>
        <DropdownMenu.ItemIndicator />
      </DropdownMenu.CheckboxItem>
      <DropdownMenu.RadioGroup defaultValue="compact" aria-label="布局密度">
        <DropdownMenu.RadioItem id={`${props.id}-compact`} value="compact">
          <DropdownMenu.ItemLabel>紧凑</DropdownMenu.ItemLabel>
          <DropdownMenu.ItemIndicator />
        </DropdownMenu.RadioItem>
        <DropdownMenu.RadioItem
          id={`${props.id}-comfortable`}
          value="comfortable"
        >
          <DropdownMenu.ItemLabel>舒适</DropdownMenu.ItemLabel>
          <DropdownMenu.ItemIndicator />
        </DropdownMenu.RadioItem>
      </DropdownMenu.RadioGroup>
      <DropdownMenu.Sub>
        <DropdownMenu.SubTrigger id={`${props.id}-sub`} textValue="More">
          更多 <span aria-hidden="true">›</span>
        </DropdownMenu.SubTrigger>
        <DropdownMenu.Portal>
          <DropdownMenu.SubContent id={`${props.id}-subcontent`}>
            <DropdownMenu.Item
              id={`${props.id}-sub-first`}
              onSelect={() => props.onAction?.("导出")}
            >
              <DropdownMenu.ItemLabel>导出</DropdownMenu.ItemLabel>
            </DropdownMenu.Item>
            <DropdownMenu.Item id={`${props.id}-sub-disabled`} disabled>
              禁用导出
            </DropdownMenu.Item>
            <DropdownMenu.Item
              id={`${props.id}-sub-last`}
              onSelect={() => props.onAction?.("分享")}
            >
              <DropdownMenu.ItemLabel>分享</DropdownMenu.ItemLabel>
            </DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Portal>
      </DropdownMenu.Sub>
    </>
  );
}

export function DropdownMenuDemo() {
  const [open, setOpen] = createSignal(false),
    [disabled, setDisabled] = createSignal(false);
  const [grid, setGrid] = createSignal(true),
    [density, setDensity] = createSignal("compact");
  const [actions, setActions] = createSignal(0),
    [message, setMessage] = createSignal("尚未选择");
  const action = (value: string) => {
    setActions((current) => current + 1);
    setMessage(value);
  };
  return (
    <div class="space-y-8">
      <AppearancePreview id="dropdown-menu">
        {(appearance, size) => (
          <div class="space-y-4">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <div class="flex flex-wrap items-center gap-3">
                    <For each={states}>
                      {(state) => {
                        const id = `dropdown-menu-${appearance}-${variant}-${size}-${state.id}`;
                        return (
                          <DropdownMenu appearance={appearance} size={size}>
                            <DropdownMenu.Trigger
                              id={id}
                              variant={variant}
                              disabled={state.disabled}
                            >
                              {state.label}
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content id={`${id}-content`}>
                                <MenuItems id={id} onAction={action} />
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu>
                        );
                      }}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <p class="text-md text-fg-muted">
        Enter、空格或方向键打开；上下方向键、Home/End
        和首字母定位，左右方向键控制子菜单。Esc
        关闭并返回焦点；普通项目选择后关闭，复选和单选项目默认保持展开。
      </p>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="dropdown-menu-live-heading"
      >
        <h3 id="dropdown-menu-live-heading" class="text-md font-medium">
          受控状态与单次操作
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <DropdownMenu
            appearance="mahjong"
            open={open()}
            onOpenChange={setOpen}
            modal={false}
          >
            <DropdownMenu.Trigger
              id="dropdown-menu-live-trigger"
              disabled={disabled()}
            >
              菜单设置
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content id="dropdown-menu-live-content">
                <DropdownMenu.Item
                  id="dropdown-menu-live-action"
                  onSelect={() => action("新建项目")}
                >
                  新建项目
                </DropdownMenu.Item>
                <DropdownMenu.CheckboxItem
                  id="dropdown-menu-live-check"
                  checked={grid()}
                  onCheckedChange={setGrid}
                >
                  <DropdownMenu.ItemLabel>显示网格</DropdownMenu.ItemLabel>
                  <DropdownMenu.ItemIndicator />
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.CheckboxItem
                  id="dropdown-menu-live-mixed"
                  indeterminate
                  defaultChecked
                  disabled
                >
                  <DropdownMenu.ItemLabel>禁用半选</DropdownMenu.ItemLabel>
                  <DropdownMenu.ItemIndicator forceMount>
                    −
                  </DropdownMenu.ItemIndicator>
                </DropdownMenu.CheckboxItem>
                <DropdownMenu.RadioGroup
                  id="dropdown-menu-live-radio"
                  value={density()}
                  onValueChange={setDensity}
                  aria-label="受控密度"
                >
                  <DropdownMenu.RadioItem
                    id="dropdown-menu-live-compact"
                    value="compact"
                  >
                    <DropdownMenu.ItemLabel>紧凑</DropdownMenu.ItemLabel>
                    <DropdownMenu.ItemIndicator />
                  </DropdownMenu.RadioItem>
                  <DropdownMenu.RadioItem
                    id="dropdown-menu-live-comfortable"
                    value="comfortable"
                  >
                    <DropdownMenu.ItemLabel>舒适</DropdownMenu.ItemLabel>
                    <DropdownMenu.ItemIndicator />
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
                <DropdownMenu.RadioGroup
                  disabled
                  defaultValue="a"
                  aria-label="禁用密度组"
                >
                  <DropdownMenu.RadioItem
                    id="dropdown-menu-live-group-disabled"
                    value="a"
                  >
                    组禁用项目
                  </DropdownMenu.RadioItem>
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu>
          <Button
            id="dropdown-menu-toggle-disabled"
            variant="outline"
            onClick={() => {
              setDisabled((current) => !current);
              setOpen(false);
            }}
          >
            {disabled() ? "启用触发器" : "禁用触发器"}
          </Button>
          <output
            id="dropdown-menu-live-status"
            aria-live="polite"
            class="text-md text-fg-muted"
          >
            操作 {actions()} 次：{message()}；网格 {grid() ? "开启" : "关闭"}
            ；密度 {density()}
          </output>
        </div>
      </section>
      <section
        class="space-y-4 border-t border-border pt-6"
        aria-labelledby="dropdown-menu-long-heading"
      >
        <h3 id="dropdown-menu-long-heading" class="text-md font-medium">
          长项目与原生属性
        </h3>
        <DropdownMenu appearance="keycap" size="lg">
          <DropdownMenu.Trigger
            id="dropdown-menu-native-trigger"
            class="text-left"
            title="Native title"
            data-demo="class-passthrough"
          >
            长菜单
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              id="dropdown-menu-long-content"
              class="text-left"
            >
              <For each={Array.from({ length: 8 }, (_, index) => index + 1)}>
                {(index) => (
                  <DropdownMenu.Item id={`dropdown-menu-long-${index}`}>
                    <DropdownMenu.ItemLabel>
                      {index} ·
                      VeryLongUnbrokenMenuItemTextForNarrowScreenWithoutHorizontalOverflow.
                    </DropdownMenu.ItemLabel>
                  </DropdownMenu.Item>
                )}
              </For>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu>
      </section>
    </div>
  );
}
