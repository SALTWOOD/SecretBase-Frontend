export interface FieldConfig {
  key: string;
  label: string;
  description?: string;
  type: "text" | "number" | "password" | "email";
  icon?: string;
  placeholder?: string;
  default?: any;
  min?: number | string;
  max?: number | string;
  presets?: { label: string; value: any }[];
  multiple?: boolean
}
