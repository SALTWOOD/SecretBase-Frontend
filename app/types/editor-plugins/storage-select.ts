import { EditorPlugin } from "~/types/editor-plugins/base";

export class StorageSelectPlugin extends EditorPlugin {
  constructor(private openModal: () => void) {
    super("从存储选择文件", "i-lucide-folder-open");
  }

  execute() {
    this.openModal();
  }
}
