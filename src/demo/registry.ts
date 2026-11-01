import type { Component } from "solid-js";
import { ThemeDemo } from "./Theme.demo";
import { ButtonDemo } from "@/components/Button/Button.demo";
import { InputDemo } from "@/components/Input/Input.demo";
import { TextareaDemo } from "@/components/Textarea/Textarea.demo";
import { CheckboxDemo } from "@/components/Checkbox/Checkbox.demo";
import { RadioGroupDemo } from "@/components/RadioGroup/RadioGroup.demo";
import { SwitchDemo } from "@/components/Switch/Switch.demo";
import { SelectDemo } from "@/components/Select/Select.demo";
import { FormFieldDemo } from "@/components/FormField/FormField.demo";
import { BadgeDemo } from "@/components/Badge/Badge.demo";
import { TagDemo } from "@/components/Tag/Tag.demo";
import { CardDemo } from "@/components/Card/Card.demo";
import { AlertDemo } from "@/components/Alert/Alert.demo";
import { SpinnerDemo } from "@/components/Spinner/Spinner.demo";
import { SkeletonDemo } from "@/components/Skeleton/Skeleton.demo";
import { AvatarDemo } from "@/components/Avatar/Avatar.demo";
import { DividerDemo } from "@/components/Divider/Divider.demo";
import { TooltipDemo } from "@/components/Tooltip/Tooltip.demo";
import { PopoverDemo } from "@/components/Popover/Popover.demo";
import { DialogDemo } from "@/components/Dialog/Dialog.demo";
import { DropdownMenuDemo } from "@/components/DropdownMenu/DropdownMenu.demo";
import { ToastDemo } from "@/components/Toast/Toast.demo";

export interface DemoEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly component: Component;
}

export const demos: readonly DemoEntry[] = [
  {
    id: "button",
    name: "Button",
    description: "5 种变体（含麻将实验）、3 种尺寸，支持禁用与加载状态。",
    component: ButtonDemo,
  },
  {
    id: "input",
    name: "Input",
    description: "3 种尺寸，支持错误、禁用、只读状态与前后缀插槽。",
    component: InputDemo,
  },
  {
    id: "textarea",
    name: "Textarea",
    description: "3 种尺寸，支持多行输入、错误/禁用/只读状态与自动增高。",
    component: TextareaDemo,
  },
  {
    id: "checkbox",
    name: "Checkbox",
    description: "3 种尺寸，支持选中、半选、错误/禁用/只读状态与原生表单。",
    component: CheckboxDemo,
  },
  {
    id: "radio-group",
    name: "Radio / RadioGroup",
    description: "3 种尺寸，支持互斥选择、横纵布局、错误/禁用/只读状态与表单。",
    component: RadioGroupDemo,
  },
  {
    id: "switch",
    name: "Switch",
    description: "3 种尺寸，支持开启/关闭、错误/禁用/只读状态与原生表单。",
    component: SwitchDemo,
  },
  {
    id: "select",
    name: "Select",
    description: "3 种尺寸，支持单选、占位、禁用选项、错误状态与原生表单。",
    component: SelectDemo,
  },
  {
    id: "form-field",
    name: "FormField",
    description: "组合标签、帮助与错误文字，提供响应式关联属性和分组控件支持。",
    component: FormFieldDemo,
  },
  {
    id: "badge",
    name: "Badge",
    description: "3 种变体、3 种尺寸的纯展示标签，支持计数与 class 透传。",
    component: BadgeDemo,
  },
  {
    id: "tag",
    name: "Tag",
    description: "3 种变体、3 种尺寸，支持命名关闭按钮、禁用和受控移除。",
    component: TagDemo,
  },
  {
    id: "card",
    name: "Card",
    description: "2 种变体、3 种尺寸的非交互内容容器，支持语义化内容组合。",
    component: CardDemo,
  },
  {
    id: "alert",
    name: "Alert",
    description: "4 种状态、3 种尺寸，提供 Kobalte 提示语义与可选标题。",
    component: AlertDemo,
  },
  {
    id: "spinner",
    name: "Spinner",
    description: "3 种外观、3 种尺寸，加载图形旋转并支持减少动态效果。",
    component: SpinnerDemo,
  },
  {
    id: "skeleton",
    name: "Skeleton",
    description: "行与块的静态占位，支持三尺寸、三外观和无障碍加载组合。",
    component: SkeletonDemo,
  },
  {
    id: "avatar",
    name: "Avatar",
    description: "圆形与方形头像，支持三尺寸、三外观和图片加载回退。",
    component: AvatarDemo,
  },
  {
    id: "divider",
    name: "Divider",
    description: "横向与竖向分隔，支持三线宽、三外观和装饰语义。",
    component: DividerDemo,
  },
  {
    id: "tooltip",
    name: "Tooltip",
    description: "Kobalte 焦点/悬停提示，支持三外观、三尺寸与 Portal。",
    component: TooltipDemo,
  },
  {
    id: "popover",
    name: "Popover",
    description: "Kobalte 可交互弹层，支持三外观、三尺寸、标题说明与模态选项。",
    component: PopoverDemo,
  },
  {
    id: "dialog",
    name: "Dialog",
    description:
      "Kobalte 模态对话框，支持三外观、三尺寸、标题说明与视口内滚动。",
    component: DialogDemo,
  },
  {
    id: "dropdown-menu",
    name: "DropdownMenu",
    description: "Kobalte 操作菜单，支持三外观、三尺寸、复选/单选与子菜单。",
    component: DropdownMenuDemo,
  },
  {
    id: "toast",
    name: "Toast",
    description:
      "Kobalte 全局通知队列，支持三外观、三尺寸、键盘关闭与暂停计时。",
    component: ToastDemo,
  },
  {
    id: "theme",
    name: "主题概览",
    description: "预览明暗配色、文字与圆角。",
    component: ThemeDemo,
  },
];
