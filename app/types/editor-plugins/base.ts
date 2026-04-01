import type { ExposeParam } from "md-editor-v3";

export abstract class EditorPlugin {
  constructor(
    public title: string,
    public icon: string,
  ) {}

  abstract execute(editor: ExposeParam | null): void;

  render() {
    return { title: this.title, icon: this.icon };
  }
}
