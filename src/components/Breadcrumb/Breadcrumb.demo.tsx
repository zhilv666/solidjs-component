import { createSignal, For } from "solid-js";
import { Breadcrumb } from "./Breadcrumb";
import { Button } from "../Button";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["plain", "outline"] as const;

export function BreadcrumbDemo() {
  const [current, setCurrent] = createSignal("styles");
  const [disabled, setDisabled] = createSignal(false);
  const [allDisabled, setAllDisabled] = createSignal(false);
  const [size, setSize] = createSignal<"sm" | "md" | "lg">("md");
  const [separator, setSeparator] = createSignal("/");
  const [changes, setChanges] = createSignal(0);
  const navigate = (value: string, event: MouseEvent) => {
    event.preventDefault();
    setCurrent(value);
    setChanges((count) => count + 1);
  };

  return (
    <div class="space-y-8">
      <AppearancePreview id="breadcrumb">
        {(appearance, size) => (
          <div class="space-y-5">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <Breadcrumb
                    id={`breadcrumb-${appearance}-${variant}-${size}`}
                    appearance={appearance}
                    variant={variant}
                    size={size}
                    aria-label={`${appearance} ${variant} ${size}`}
                  >
                    <Breadcrumb.List>
                      <Breadcrumb.Item>
                        <Breadcrumb.Link href="#breadcrumb-live-heading">
                          首页
                        </Breadcrumb.Link>
                        <Breadcrumb.Separator />
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>
                        <Breadcrumb.Link href="#breadcrumb-live-heading">
                          组件
                        </Breadcrumb.Link>
                        <Breadcrumb.Separator />
                      </Breadcrumb.Item>
                      <Breadcrumb.Item>
                        <Breadcrumb.Link
                          current
                          href="#breadcrumb-live-heading"
                        >
                          样式
                        </Breadcrumb.Link>
                      </Breadcrumb.Item>
                    </Breadcrumb.List>
                  </Breadcrumb>
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <section class="space-y-4" aria-labelledby="breadcrumb-live-heading">
        <h3 id="breadcrumb-live-heading" class="text-md font-medium">
          导航与动态状态
        </h3>
        <p class="text-md text-fg-muted">
          Tab/Shift+Tab 在可用链接间移动，Enter 导航。当前页与禁用链接不参与
          Tab，也不会触发导航回调。 可使用普通 href 或在 onClick
          中对接应用路由；示例使用绑定事件更新当前页。
        </p>
        <div class="flex flex-wrap gap-3">
          <Button
            id="breadcrumb-toggle-disabled"
            variant="outline"
            aria-pressed={disabled()}
            onClick={() => setDisabled((value) => !value)}
          >
            {disabled() ? "启用组件链接" : "禁用组件链接"}
          </Button>
          <Button
            id="breadcrumb-toggle-all"
            variant="ghost"
            aria-pressed={allDisabled()}
            onClick={() => setAllDisabled((value) => !value)}
          >
            {allDisabled() ? "启用整组" : "禁用整组"}
          </Button>
          <Button
            id="breadcrumb-toggle-size"
            variant="ghost"
            onClick={() =>
              setSize((value) =>
                value === "sm" ? "md" : value === "md" ? "lg" : "sm",
              )
            }
          >
            尺寸：{size()}
          </Button>
          <Button
            id="breadcrumb-toggle-separator"
            variant="ghost"
            onClick={() => setSeparator((value) => (value === "/" ? "›" : "/"))}
          >
            切换分隔符
          </Button>
          <Button
            id="breadcrumb-reset"
            variant="ghost"
            onClick={() => {
              setCurrent("styles");
              setDisabled(false);
              setAllDisabled(false);
            }}
          >
            回到样式页
          </Button>
        </div>
        <Breadcrumb
          id="breadcrumb-live"
          variant="outline"
          size={size()}
          separator={separator()}
          disabled={allDisabled()}
          aria-label="交互面包屑"
        >
          <Breadcrumb.List id="breadcrumb-live-list">
            <Breadcrumb.Item>
              <Breadcrumb.Link
                id="breadcrumb-home"
                href="#breadcrumb-live-heading"
                current={current() === "home"}
                onClick={[navigate, "home"]}
              >
                首页
              </Breadcrumb.Link>
              <Breadcrumb.Separator />
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.Link
                id="breadcrumb-components"
                href="#breadcrumb-live-heading"
                current={current() === "components"}
                disabled={disabled()}
                onClick={[navigate, "components"]}
              >
                组件
              </Breadcrumb.Link>
              <Breadcrumb.Separator />
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.Link
                id="breadcrumb-styles"
                href="#breadcrumb-live-heading"
                current={current() === "styles"}
                onClick={(event) => navigate("styles", event)}
              >
                样式
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <output
          id="breadcrumb-status"
          class="block text-md text-fg-muted"
          aria-live="polite"
        >
          当前：{current()}；导航 {changes()} 次
        </output>
      </section>
      <section class="space-y-4" aria-labelledby="breadcrumb-long-heading">
        <h3 id="breadcrumb-long-heading" class="text-md font-medium">
          原生链接与长路径
        </h3>
        <Breadcrumb
          id="breadcrumb-long"
          appearance="keycap"
          class="w-full"
          aria-label="长路径面包屑"
          separator="›"
        >
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link
                id="breadcrumb-icon"
                href="#breadcrumb-long-heading"
                aria-label="项目主页"
                title="Native title"
              >
                <span aria-hidden="true">⌂</span>
              </Breadcrumb.Link>
              <Breadcrumb.Separator />
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.Link
                id="breadcrumb-long-link"
                href="#breadcrumb-live-heading"
              >
                VeryLongUnbrokenComponentDirectoryNameForNarrowScreensAndReadableNavigation
              </Breadcrumb.Link>
              <Breadcrumb.Separator />
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.Link current>
                主题配置与外观说明 / Theme configuration
              </Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Breadcrumb id="breadcrumb-single" aria-label="单层路径">
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link current>首页</Breadcrumb.Link>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb>
        <Breadcrumb id="breadcrumb-empty" aria-label="空路径">
          <Breadcrumb.List />
        </Breadcrumb>
      </section>
    </div>
  );
}
