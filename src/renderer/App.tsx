import React, { useState, useEffect, useRef } from 'react';
import {
  Header,
} from './components/Header';
import { SourceList } from './components/SourceList';
import { AspectControl } from './components/AspectControl';
import { WatermarkControl } from './components/WatermarkControl';
import { ExportSettingsControl } from './components/ExportSettingsControl';
import { PreviewPane } from './components/PreviewPane';
import { BatchProgressModal } from './components/BatchProgressModal';
import {
  SourceImageItem,
  AspectSettings,
  WatermarkSettings,
  ExportSettings,
  BatchProgressPayload,
  ProcessBatchResult,
} from './types';
import { Crop, Stamp, Download } from 'lucide-react';
import {
  isElectronApp,
  selectFilesWeb,
  selectFolderWeb,
  selectWatermarkWeb,
  parseFilesToSourceItems,
} from './utils/fileHelpers';
import { processBatchWeb } from './utils/webBatchProcessor';

export const App: React.FC = () => {
  const isElectron = isElectronApp();
  const isCancelledRef = useRef<boolean>(false);

  // Theme state (dark / light)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Source images
  const [items, setItems] = useState<SourceImageItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SourceImageItem | null>(null);

  // Aspect settings
  const [aspectSettings, setAspectSettings] = useState<AspectSettings>({
    preset: '4:5',
    customWidth: 16,
    customHeight: 9,
    backgroundMode: 'blur',
    solidColor: '#000000',
    blurSigma: 28,
  });

  // Watermark settings
  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
    enabled: true,
    filePath: null,
    anchor: 'bottom-right',
    sizePercent: 16,
    opacity: 0.85,
    marginPercent: 4,
  });
  const [watermarkThumbnail, setWatermarkThumbnail] = useState<string | null>(null);
  const [watermarkFileName, setWatermarkFileName] = useState<string | null>(null);
  const [watermarkImgElement, setWatermarkImgElement] = useState<HTMLImageElement | null>(null);

  // Export settings
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    outputFolder: isElectron ? null : 'Downloads (ZIP Archive)',
    outputFormat: 'original',
    quality: 90,
    prefix: '',
    suffix: '_aspect',
  });

  // Right sidebar active tab
  const [activeTab, setActiveTab] = useState<'aspect' | 'watermark' | 'export'>('aspect');

  // Sidebar collapse toggles for maximized preview
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Batch process state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<BatchProgressPayload | null>(null);
  const [batchResult, setBatchResult] = useState<ProcessBatchResult | null>(null);

  // Toggle Theme
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  // Subscribe to progress events from Electron main process
  useEffect(() => {
    if (window.electronAPI?.onBatchProgress) {
      const unsubscribe = window.electronAPI.onBatchProgress((payload) => {
        setBatchProgress(payload);
        if (payload.status === 'completed' || payload.status === 'cancelled') {
          setIsProcessing(false);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Keyboard navigation for image queue (Up / Down / Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept if user is typing in an input field or modal
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (items.length === 0) return;
        e.preventDefault();
        setSelectedItem((curr) => {
          if (!curr) return items[0];
          const idx = items.findIndex((it) => it.id === curr.id);
          if (idx === -1) return items[0];
          const nextIdx = Math.min(items.length - 1, idx + 1);
          return items[nextIdx];
        });
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (items.length === 0) return;
        e.preventDefault();
        setSelectedItem((curr) => {
          if (!curr) return items[0];
          const idx = items.findIndex((it) => it.id === curr.id);
          if (idx === -1) return items[0];
          const prevIdx = Math.max(0, idx - 1);
          return items[prevIdx];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  // Sync watermark HTMLImageElement whenever watermark path changes
  useEffect(() => {
    if (!watermarkSettings.filePath) {
      setWatermarkImgElement(null);
      return;
    }

    const img = new Image();
    const hasElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
    const isBlobOrData = watermarkThumbnail?.startsWith('blob:') || watermarkThumbnail?.startsWith('data:');

    const safeSrc = !hasElectron || isBlobOrData
      ? (watermarkThumbnail || watermarkSettings.filePath)
      : `app-img://image?path=${encodeURIComponent(watermarkSettings.filePath)}`;

    img.src = safeSrc;

    img.onload = () => {
      setWatermarkImgElement(img);
    };

    img.onerror = () => {
      if (watermarkThumbnail && img.src !== watermarkThumbnail) {
        img.src = watermarkThumbnail;
      }
    };
  }, [watermarkSettings.filePath, watermarkThumbnail]);

  // File Handlers
  const handleAddFiles = async () => {
    try {
      let newItems: SourceImageItem[] = [];
      if (window.electronAPI?.openFiles) {
        newItems = await window.electronAPI.openFiles();
      } else {
        const files = await selectFilesWeb(true);
        if (files.length > 0) {
          newItems = await parseFilesToSourceItems(files);
        }
      }

      if (newItems && newItems.length > 0) {
        setItems((prev) => {
          const combined = [...prev, ...newItems];
          const seen = new Set<string>();
          return combined.filter((it) => {
            const key = it.id || it.filePath;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        if (!selectedItem) {
          setSelectedItem(newItems[0]);
        }
      }
    } catch (err) {
      console.error('Error opening files:', err);
    }
  };

  const handleAddFolder = async () => {
    try {
      let newItems: SourceImageItem[] = [];
      if (window.electronAPI?.openFolder) {
        newItems = await window.electronAPI.openFolder();
      } else {
        const files = await selectFolderWeb();
        if (files.length > 0) {
          newItems = await parseFilesToSourceItems(files);
        }
      }

      if (newItems && newItems.length > 0) {
        setItems((prev) => {
          const combined = [...prev, ...newItems];
          const seen = new Set<string>();
          return combined.filter((it) => {
            const key = it.id || it.filePath;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        if (!selectedItem) {
          setSelectedItem(newItems[0]);
        }
      }
    } catch (err) {
      console.error('Error opening folder:', err);
    }
  };

  const handleDropFiles = async (paths: string[], files?: File[]) => {
    try {
      let newItems: SourceImageItem[] = [];
      if (window.electronAPI?.inspectPaths && paths.length > 0) {
        newItems = await window.electronAPI.inspectPaths(paths);
      } else if (files && files.length > 0) {
        newItems = await parseFilesToSourceItems(files);
      }

      if (newItems && newItems.length > 0) {
        setItems((prev) => {
          const combined = [...prev, ...newItems];
          const seen = new Set<string>();
          return combined.filter((it) => {
            const key = it.id || it.filePath;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        if (!selectedItem) {
          setSelectedItem(newItems[0]);
        }
      }
    } catch (err) {
      console.error('Error handling dropped items:', err);
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      if (selectedItem?.id === id) {
        setSelectedItem(updated[0] || null);
      }
      return updated;
    });
  };

  const handleClearAll = () => {
    setItems([]);
    setSelectedItem(null);
  };

  // Watermark selector
  const handleSelectWatermark = async () => {
    try {
      let res: { filePath: string; thumbnailUrl: string; fileName: string } | null = null;
      if (window.electronAPI?.selectWatermark) {
        res = await window.electronAPI.selectWatermark();
      } else {
        res = await selectWatermarkWeb();
      }

      if (res) {
        setWatermarkSettings((prev) => ({
          ...prev,
          enabled: true,
          filePath: res!.filePath,
        }));
        setWatermarkThumbnail(res.thumbnailUrl);
        setWatermarkFileName(res.fileName);
      }
    } catch (err) {
      console.error('Error selecting watermark:', err);
    }
  };

  const handleClearWatermark = () => {
    setWatermarkSettings((prev) => ({ ...prev, filePath: null, enabled: false }));
    setWatermarkThumbnail(null);
    setWatermarkFileName(null);
    setWatermarkImgElement(null);
  };

  // Output folder selector
  const handleSelectOutputFolder = async () => {
    if (window.electronAPI?.selectOutputFolder) {
      try {
        const folder = await window.electronAPI.selectOutputFolder();
        if (folder) {
          setExportSettings((prev) => ({ ...prev, outputFolder: folder }));
        }
      } catch (err) {
        console.error('Error selecting output directory:', err);
      }
    }
  };

  // Start batch processing (Electron native or Web client-side)
  const handleStartBatch = async () => {
    if (items.length === 0 || isProcessing) return;

    if (window.electronAPI?.startBatch) {
      // Native Electron workflow
      let targetFolder = exportSettings.outputFolder;
      if (window.electronAPI.selectOutputFolder) {
        let initialDir = targetFolder;
        if (!initialDir) {
          const samplePath = selectedItem?.filePath || items[0]?.filePath;
          if (samplePath) {
            const sep = samplePath.includes('/') ? '/' : '\\';
            initialDir = samplePath.substring(0, samplePath.lastIndexOf(sep));
          }
        }

        const chosen = await window.electronAPI.selectOutputFolder(initialDir || undefined);
        if (!chosen) {
          return;
        }
        targetFolder = chosen;
        setExportSettings((prev) => ({ ...prev, outputFolder: chosen }));
      }

      if (!targetFolder) return;

      setIsProcessing(true);
      setBatchResult(null);
      setBatchProgress({
        currentIndex: 0,
        totalImages: items.length,
        currentFileName: items[0].fileName,
        progressPercent: 0,
        status: 'processing',
      });
      setIsProgressModalOpen(true);

      try {
        const result = await window.electronAPI.startBatch({
          items,
          aspectSettings,
          watermarkSettings,
          exportSettings: {
            ...exportSettings,
            outputFolder: targetFolder,
          },
        });
        setBatchResult(result);
      } catch (err: any) {
        console.error('Batch processing encountered error:', err);
        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                status: 'error',
                errorMessage: err.message || 'Batch execution failed',
              }
            : null
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Web browser workflow (GitHub Pages / pure client)
      setIsProcessing(true);
      setBatchResult(null);
      isCancelledRef.current = false;
      setBatchProgress({
        currentIndex: 0,
        totalImages: items.length,
        currentFileName: items[0].fileName,
        progressPercent: 0,
        status: 'processing',
        outputPath: 'Downloads (ZIP Archive)',
      });
      setIsProgressModalOpen(true);

      try {
        const result = await processBatchWeb({
          items,
          aspectSettings,
          watermarkSettings,
          watermarkImg: watermarkImgElement,
          exportSettings,
          onProgress: (p) => setBatchProgress(p),
          checkCancelled: () => isCancelledRef.current,
        });
        setBatchResult(result);
      } catch (err: any) {
        console.error('Web batch processing error:', err);
        setBatchProgress((prev) =>
          prev
            ? {
                ...prev,
                status: 'error',
                errorMessage: err.message || 'Batch execution failed',
              }
            : null
        );
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCancelBatch = async () => {
    if (window.electronAPI?.cancelBatch) {
      await window.electronAPI.cancelBatch();
    } else {
      isCancelledRef.current = true;
    }
  };

  const handleOpenOutputFolder = async (folder: string) => {
    if (window.electronAPI?.openPath) {
      await window.electronAPI.openPath(folder);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Top Header */}
      <Header
        itemCount={items.length}
        outputFolder={exportSettings.outputFolder}
        onStartBatch={handleStartBatch}
        isProcessing={isProcessing}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Studio Workspace: 3-column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Source Image Queue */}
        {!isLeftCollapsed && (
          <SourceList
            items={items}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onAddFiles={handleAddFiles}
            onAddFolder={handleAddFolder}
            onDropFiles={handleDropFiles}
            onRemoveItem={handleRemoveItem}
            onClearAll={handleClearAll}
          />
        )}

        {/* Center: Live Interactive Preview */}
        <PreviewPane
          selectedItem={selectedItem}
          aspectSettings={aspectSettings}
          watermarkSettings={watermarkSettings}
          watermarkImg={watermarkImgElement}
          isLeftCollapsed={isLeftCollapsed}
          isRightCollapsed={isRightCollapsed}
          onToggleLeft={() => setIsLeftCollapsed((v) => !v)}
          onToggleRight={() => setIsRightCollapsed((v) => !v)}
        />

        {/* Right: Studio Control Inspector */}
        {!isRightCollapsed && (
          <aside className="w-80 border-l border-[var(--border-subtle)] bg-[var(--bg-panel)] flex flex-col h-full z-10 shrink-0">
          {/* Inspector Navigation Tabs */}
          <div className="p-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--chip-surface)] border border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveTab('aspect')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'aspect'
                    ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Crop className="w-3.5 h-3.5" />
                <span>Canvas</span>
              </button>

              <button
                onClick={() => setActiveTab('watermark')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'watermark'
                    ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Logo</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'export'
                    ? 'bg-white text-black dark:bg-white dark:text-black font-semibold shadow-patensify-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Inspector Panel Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'aspect' && (
              <AspectControl
                settings={aspectSettings}
                onChange={setAspectSettings}
              />
            )}

            {activeTab === 'watermark' && (
              <WatermarkControl
                settings={watermarkSettings}
                onChange={setWatermarkSettings}
                onSelectWatermark={handleSelectWatermark}
                watermarkThumbnail={watermarkThumbnail}
                watermarkFileName={watermarkFileName}
                onClearWatermark={handleClearWatermark}
              />
            )}

            {activeTab === 'export' && (
              <ExportSettingsControl
                settings={exportSettings}
                onChange={setExportSettings}
                onSelectFolder={handleSelectOutputFolder}
              />
            )}
          </div>
        </aside>
        )}
      </div>

      {/* Batch Processing Overlay Modal */}
      <BatchProgressModal
        isOpen={isProgressModalOpen}
        progress={batchProgress}
        result={batchResult}
        onCancel={handleCancelBatch}
        onClose={() => setIsProgressModalOpen(false)}
        onOpenOutputFolder={handleOpenOutputFolder}
      />
    </div>
  );
};
