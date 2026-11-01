import { createMemo, createSignal, For } from "solid-js";
import { Table, type TableColumn, type TableSortState } from "./index";
import { Button } from "../Button";
import { Input } from "../Input";
import { clampPaginationPage } from "../Pagination/state";
import { AppearancePreview } from "../../demo/AppearancePreview";

interface DemoRow {
  id: string;
  name: string;
  score: number | null;
  note: string;
  disabled?: boolean;
}

const rows: readonly DemoRow[] = [
  { id: "alpha", name: "Alpha", score: 24, note: "Design tokens" },
  { id: "beta", name: "Beta", score: 10, note: "List selection" },
  {
    id: "locked",
    name: "Locked",
    score: 15,
    note: "Selection disabled",
    disabled: true,
  },
  { id: "gamma", name: "Gamma", score: 10, note: "Stable sorting" },
  { id: "delta", name: "Delta", score: 37, note: "Local pagination" },
  { id: "echo", name: "Echo", score: null, note: "Empty score stays last" },
  { id: "foxtrot", name: "Foxtrot", score: 6, note: "Keyboard access" },
  { id: "golf", name: "Golf", score: 24, note: "Theme inheritance" },
];
const getRowKey = (row: DemoRow) => row.id;
const getRowLabel = (row: DemoRow) => row.name;
const getRowDisabled = (row: DemoRow) => row.disabled ?? false;
const columns: readonly TableColumn<DemoRow>[] = [
  {
    key: "name",
    header: "名称",
    cell: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    key: "score",
    header: "评分",
    cell: (row) => row.score ?? "—",
    sortValue: (row) => row.score,
    align: "end",
  },
  { key: "note", header: "备注", cell: (row) => row.note },
];
const variants = ["outline", "plain"] as const;

export function TableDemo() {
  const [selected, setSelected] = createSignal<readonly string[]>(["alpha"]);
  const [sort, setSort] = createSignal<TableSortState | null>(null);
  const [page, setPage] = createSignal(1);
  const [disabled, setDisabled] = createSignal(false);
  const [reversed, setReversed] = createSignal(false);
  const [reduced, setReduced] = createSignal(false);
  const [size, setSize] = createSignal<"md" | "lg">("md");
  const [selectionChanges, setSelectionChanges] = createSignal(0);
  const [sortChanges, setSortChanges] = createSignal(0);
  const [pageChanges, setPageChanges] = createSignal(0);
  const [fixedChanges, setFixedChanges] = createSignal(0);
  const [uncontrolled, setUncontrolled] = createSignal("尚未操作");
  const [submits, setSubmits] = createSignal(0);
  const data = createMemo(() => {
    const current = reduced() ? rows.slice(0, 2) : [...rows];
    return reversed() ? current.reverse() : current;
  });
  const liveColumns: readonly TableColumn<DemoRow>[] = [
    ...columns.slice(0, 2),
    {
      key: "note",
      header: "可编辑备注",
      cell: (row) => (
        <Input
          id={`table-note-${row.id}`}
          aria-label={`备注 ${row.name}`}
          defaultValue={row.note}
          disabled={disabled() || (row.disabled ?? false)}
          class="min-w-32"
        />
      ),
    },
  ];
  const visiblePage = createMemo(() =>
    clampPaginationPage(page(), Math.ceil(data().length / 3)),
  );

  return (
    <div class="min-w-0 space-y-8">
      <AppearancePreview id="table">
        {(appearance, currentSize) => (
          <div class="min-w-0 space-y-5">
            <For each={variants}>
              {(variant) => (
                <Table
                  id={`table-${appearance}-${variant}-${currentSize}`}
                  appearance={appearance}
                  variant={variant}
                  size={currentSize}
                  data={rows.slice(0, 3)}
                  columns={columns.slice(0, 2)}
                  getRowKey={getRowKey}
                  getRowLabel={getRowLabel}
                  getRowDisabled={getRowDisabled}
                  caption={`${variant} · ${currentSize}`}
                  selectable
                  striped
                  defaultValue={["alpha"]}
                />
              )}
            </For>
          </div>
        )}
      </AppearancePreview>
      <section class="min-w-0 space-y-4" aria-labelledby="table-live-heading">
        <h3 id="table-live-heading" class="text-md font-medium">
          选择、排序与本地分页
        </h3>
        <p class="text-md text-fg-muted">
          Tab/Shift+Tab 移动，空格切换复选框，Enter 或空格激活排序与分页。
          全选只处理当前页可选行，跨页选择保留；评分相同时保持原数据顺序，空值始终在最后。
          排序循环为升序、降序、取消，并保留当前页码。先排序全数据，再分页。
        </p>
        <div class="flex flex-wrap gap-3">
          <Button
            id="table-toggle-disabled"
            variant="outline"
            aria-pressed={disabled()}
            onClick={() => setDisabled((current) => !current)}
          >
            {disabled() ? "启用表格控件" : "禁用表格控件"}
          </Button>
          <Button
            id="table-toggle-order"
            variant="ghost"
            onClick={() => setReversed((current) => !current)}
          >
            反转原始数据
          </Button>
          <Button
            id="table-toggle-data"
            variant="ghost"
            onClick={() => setReduced((current) => !current)}
          >
            {reduced() ? "恢复全部数据" : "缩减到两行"}
          </Button>
          <Button
            id="table-toggle-size"
            variant="ghost"
            onClick={() =>
              setSize((current) => (current === "md" ? "lg" : "md"))
            }
          >
            切换尺寸
          </Button>
          <Button
            id="table-reset"
            variant="ghost"
            onClick={() => {
              setSelected(["alpha"]);
              setSort(null);
              setPage(1);
              setDisabled(false);
              setReversed(false);
              setReduced(false);
              setSize("md");
            }}
          >
            重置受控状态
          </Button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmits((current) => current + 1);
          }}
        >
          <Table
            id="table-live"
            data={data()}
            columns={liveColumns}
            getRowKey={getRowKey}
            getRowLabel={getRowLabel}
            getRowDisabled={getRowDisabled}
            caption="组件任务 / 受控表格"
            size={size()}
            disabled={disabled()}
            selectable
            striped
            paginate
            pageSize={3}
            value={selected()}
            sort={sort()}
            page={page()}
            onValueChange={(next) => {
              setSelected(next);
              setSelectionChanges((current) => current + 1);
            }}
            onSortChange={(next) => {
              setSort(next);
              setSortChanges((current) => current + 1);
            }}
            onPageChange={(next) => {
              setPage(next);
              setPageChanges((current) => current + 1);
            }}
            class="min-w-120"
            title="Native table attributes"
            data-demo="class-passthrough"
            scrollLabel="组件任务表格滚动区域"
          />
        </form>
        <output
          id="table-live-status"
          class="block break-words text-md text-fg-muted"
          aria-live="polite"
        >
          选中 {selected().join(", ") || "无"}；排序{" "}
          {sort() ? `${sort()!.column} ${sort()!.direction}` : "无"}； 显示页{" "}
          {visiblePage()} / {Math.ceil(data().length / 3)}，外部页 {page()}；
          选择/排序/分页请求 {selectionChanges()}/{sortChanges()}/
          {pageChanges()} 次
        </output>
        <output id="table-form-status" class="block text-md text-fg-muted">
          表单提交 {submits()} 次
        </output>
        <p class="text-md text-fg-muted">
          数据缩减只约束显示页码，不自动改写外部页码；缺失选中键不显示，下一次选择请求清理缺失键。
          行在当前页内重排时保留节点；离开分页会卸载单元格，跨页编辑值请由调用方保存。
          横向溢出时滚动区域才加入 Tab 顺序，可用原生左右方向键滚动。
        </p>
      </section>
      <section class="min-w-0 space-y-4" aria-labelledby="table-state-heading">
        <h3 id="table-state-heading" class="text-md font-medium">
          非受控与拒绝变更
        </h3>
        <Table
          id="table-uncontrolled"
          data={rows}
          columns={columns}
          getRowKey={getRowKey}
          getRowLabel={getRowLabel}
          getRowDisabled={getRowDisabled}
          caption="非受控：评分升序，初始第 2 页"
          selectable
          paginate
          pageSize={3}
          defaultValue={["beta", "locked"]}
          defaultSort={{ column: "score", direction: "asc" }}
          defaultPage={2}
          onValueChange={(next) =>
            setUncontrolled(`选中 ${next.join(", ") || "无"}`)
          }
          onSortChange={(next) =>
            setUncontrolled(
              next ? `排序 ${next.column} ${next.direction}` : "取消排序",
            )
          }
          onPageChange={(next) => setUncontrolled(`页码 ${next}`)}
        />
        <output
          id="table-uncontrolled-status"
          class="block text-md text-fg-muted"
          aria-live="polite"
        >
          {uncontrolled()}
        </output>
        <Table
          id="table-fixed"
          data={rows}
          columns={columns}
          getRowKey={getRowKey}
          getRowLabel={getRowLabel}
          getRowDisabled={getRowDisabled}
          caption="固定受控空选择 / 无排序 / 第 2 页"
          selectable
          paginate
          pageSize={3}
          value={[]}
          defaultValue={["alpha"]}
          sort={null}
          defaultSort={{ column: "score", direction: "desc" }}
          page={2}
          onValueChange={() => setFixedChanges((current) => current + 1)}
          onSortChange={() => setFixedChanges((current) => current + 1)}
          onPageChange={() => setFixedChanges((current) => current + 1)}
        />
        <output
          id="table-fixed-status"
          class="block text-md text-fg-muted"
          aria-live="polite"
        >
          已拒绝 {fixedChanges()} 次变更请求
        </output>
      </section>
      <section class="min-w-0 space-y-4" aria-labelledby="table-edge-heading">
        <h3 id="table-edge-heading" class="text-md font-medium">
          空态、全组禁用与横向滚动
        </h3>
        <Table
          id="table-empty"
          data={[]}
          columns={columns}
          getRowKey={getRowKey}
          caption="暂无组件任务"
          emptyContent="暂无数据，请添加任务。"
          selectable
          paginate
        />
        <Table
          id="table-disabled"
          data={rows.slice(0, 3)}
          columns={columns}
          getRowKey={getRowKey}
          getRowLabel={getRowLabel}
          caption="表格控件全部禁用"
          appearance="mahjong"
          selectable
          paginate
          pageSize={2}
          disabled
          defaultValue={["alpha"]}
        />
        <Table
          id="table-long"
          data={[
            {
              id: "long",
              name: "VeryLongUnbrokenComponentNameForHorizontalScrolling",
              score: 0,
              note: "这是长内容和窄屏演示。请聚焦滚动区域，用方向键横向滚动，或者触摸滑动查看最后一列。",
            },
          ]}
          columns={columns}
          getRowKey={getRowKey}
          caption="长内容 / 原生横向滚动"
          appearance="keycap"
          class="min-w-160"
          scrollLabel="长内容表格滚动区域"
        />
      </section>
    </div>
  );
}
