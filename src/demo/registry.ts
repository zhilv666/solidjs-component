import type { Component } from "solid-js";
import { ThemeDemo } from "./Theme.demo";
import { ButtonDemo } from "@/components/Button/Button.demo";
import { InputDemo } from "@/components/Input/Input.demo";

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
    id: "theme",
    name: "主题概览",
    description: "预览明暗配色、文字与圆角。",
    component: ThemeDemo,
  },
];
