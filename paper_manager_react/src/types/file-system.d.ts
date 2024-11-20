interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

interface Window {
  showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
} 