export interface FieldConfig {
  key: string;
  label: string;
  description?: string;
  type: "text" | "number" | "password" | "email" | "select";
  icon?: string;
  placeholder?: string;
  default?: any;
  min?: number | string;
  max?: number | string;
  presets?: { label: string; value: any }[];
  options?: { label: string; value: any }[];
  multiple?: boolean;
  disabled?: boolean;
  action?: {
    icon: string;
    tooltip?: string;
    onClick?: (value: any, formData: Record<string, any>) => void;
  };
}
