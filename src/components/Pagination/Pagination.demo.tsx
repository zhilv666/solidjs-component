import { createMemo, createSignal, For } from "solid-js";
import { Pagination } from "./Pagination";
import { clampPaginationPage } from "./state";
import { Button } from "../Button";
import { AppearancePreview } from "../../demo/AppearancePreview";

const variants = ["outline", "ghost"] as const;

export function PaginationDemo() {
  const [page, setPage] = createSignal(10);
  const [count, setCount] = createSignal(30);
  const [disabled, setDisabled] = createSignal(false);
  const [changes, setChanges] = createSignal(0);
  const [uncontrolled, setUncontrolled] = createSignal(3);
  const [submits, setSubmits] = createSignal(0);
  const visiblePage = createMemo(() => clampPaginationPage(page(), count()));

  return (
    <div class="space-y-8">
      <AppearancePreview id="pagination">
        {(appearance, size) => (
          <div class="space-y-5">
            <For each={variants}>
              {(variant) => (
                <div class="space-y-2">
                  <p class="text-md text-fg-muted">
                    {variant} · {size}
                  </p>
                  <Pagination
                    id={`pagination-${appearance}-${variant}-${size}`}
                    appearance={appearance}
                    variant={variant}
                    size={size}
                    count={5}
                    defaultPage={2}
                    aria-label={`${appearance} ${variant} ${size}`}
                  />
                </div>
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <section class="space-y-4" aria-labelledby="pagination-live-heading">
        <h3 id="pagination-live-heading" class="text-md font-medium">
          页码、边界与受控状态
        </h3>
        <p class="text-md text-fg-muted">
          Tab/Shift+Tab 移动，Enter
          或空格激活。首尾按钮在边界禁用；省略号不参与焦点。 页码为 1
          起始。count=0
          显示禁用占位页；页数缩小时只约束显示页码，不自动请求外部状态变更。
        </p>
        <div class="flex flex-wrap gap-3">
          <Button
            id="pagination-toggle-disabled"
            variant="outline"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用分页" : "禁用分页"}
          </Button>
          <Button
            id="pagination-toggle-count"
            variant="ghost"
            onClick={() => setCount((current) => (current === 30 ? 3 : 30))}
          >
            {count() === 30 ? "缩减到 3 页" : "恢复 30 页"}
          </Button>
          <Button
            id="pagination-reset"
            variant="ghost"
            onClick={() => {
              setPage(1);
              setCount(30);
            }}
          >
            回到第一页
          </Button>
        </div>
        <Pagination
          id="pagination-live"
          count={count()}
          page={page()}
          disabled={disabled()}
          onPageChange={(next) => {
            setPage(next);
            setChanges((current) => current + 1);
          }}
          aria-label="受控分页"
        />
        <output
          id="pagination-live-status"
          class="block text-md text-fg-muted"
          aria-live="polite"
        >
          显示 {visiblePage()} / {count()}；外部页码 {page()}；请求 {changes()}{" "}
          次
        </output>
        <Pagination
          id="pagination-uncontrolled"
          count={10}
          defaultPage={3}
          onPageChange={setUncontrolled}
          aria-label="非受控分页"
        />
        <output
          id="pagination-uncontrolled-status"
          class="block text-md text-fg-muted"
          aria-live="polite"
        >
          非受控 {uncontrolled()}
        </output>
        <Pagination
          id="pagination-fixed"
          count={5}
          page={2}
          onPageChange={() => setChanges((current) => current + 1)}
          aria-label="拒绝变更的固定分页"
        />
        <Pagination id="pagination-empty" count={0} aria-label="空分页" />
        <Pagination
          id="pagination-disabled"
          appearance="mahjong"
          count={5}
          defaultPage={2}
          disabled
          aria-label="整组禁用分页"
        />
      </section>
      <section class="space-y-4" aria-labelledby="pagination-long-heading">
        <h3 id="pagination-long-heading" class="text-md font-medium">
          长标签与表单安全
        </h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmits((current) => current + 1);
          }}
        >
          <Pagination
            id="pagination-long"
            appearance="keycap"
            count={3}
            defaultPage={2}
            previousLabel="VeryLongUnbrokenPreviousPageLabelForNarrowScreens"
            nextLabel="VeryLongUnbrokenNextPageLabelForNarrowScreens"
            aria-label="长标签分页"
          />
        </form>
        <output id="pagination-form-status" class="text-md text-fg-muted">
          表单提交 {submits()} 次
        </output>
      </section>
    </div>
  );
}
