import * as vscode from 'vscode';
import { readFileSync, existsSync } from 'fs';

export class TypewriterPanelProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'typewriter.slotsView';
    private _view?: vscode.WebviewView;

    constructor(private readonly _context: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this._getHtml();

        const saved = this._context.globalState.get<{ texts: string[]; minDelay: number; maxDelay: number }>('typewriter.slotState');
        if (saved) {
            webviewView.webview.postMessage({ command: 'restoreState', ...saved });
        }

        // Auto-load last opened file if it still exists
        const lastFile = this._context.globalState.get<string>('typewriter.lastFile');
        if (lastFile && existsSync(lastFile)) {
            const content = readFileSync(lastFile, 'utf-8');
            const parts = content.split(/\s*-{5,100}\s*/g).slice(0, 9);
            webviewView.webview.postMessage({ command: 'fillSlots', texts: parts });
        }

        webviewView.webview.onDidReceiveMessage(async (msg) => {
            if (msg.command === 'openFile') {
                const uris = await vscode.window.showOpenDialog({
                    canSelectMany: false,
                    filters: { 'Text files': ['txt'] }
                });
                if (uris && uris.length > 0) {
                    const content = readFileSync(uris[0].fsPath, 'utf-8');
                    const parts = content.split(/\s*-{5,100}\s*/g).slice(0, 9);
                    webviewView.webview.postMessage({ command: 'fillSlots', texts: parts });
                    this._context.globalState.update('typewriter.lastFile', uris[0].fsPath);
                }
            } else if (msg.command === 'saveState') {
                this._context.globalState.update('typewriter.slotState', {
                    texts: msg.texts,
                    minDelay: msg.minDelay,
                    maxDelay: msg.maxDelay
                });
            }
        });
    }

    public getSlotText(slot: number): string {
        const state = this._context.globalState.get<{ texts: string[] }>('typewriter.slotState');
        return (state && state.texts && state.texts[slot]) || '';
    }

    public getDelays(): { min: number; max: number } {
        const state = this._context.globalState.get<{ minDelay: number; maxDelay: number }>('typewriter.slotState');
        return {
            min: (state && state.minDelay) || 30,
            max: (state && state.maxDelay) || 120
        };
    }

    private _getHtml(): string {
        const isMac = process.platform === 'darwin';
        const mod = isMac ? 'Ctrl-Shift-Opt' : 'Ctrl-Shift-Alt';

        const slots = Array.from({ length: 9 }, (_, i) => {
            const n = i + 1;
            return `        <details>
            <summary>${mod}-${n}</summary>
            <textarea id="slot${n}" rows="6" placeholder="Text for slot ${n}..."></textarea>
        </details>`;
        }).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); padding: 8px; margin: 0; }
  button { width: 100%; padding: 5px 8px; margin-bottom: 8px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; font-size: inherit; }
  button:hover { background: var(--vscode-button-hoverBackground); }
  .delays { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; align-items: center; font-size: 0.9em; }
  .delays label { white-space: nowrap; }
  .delays input { width: 55px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 2px 4px; }
  details { margin-bottom: 3px; border: 1px solid var(--vscode-panel-border); }
  summary { padding: 4px 8px; cursor: pointer; background: var(--vscode-sideBarSectionHeader-background); list-style: none; user-select: none; font-size: 0.9em; }
  summary::-webkit-details-marker { display: none; }
  summary::before { content: '\\25B6  '; font-size: 0.7em; }
  details[open] summary::before { content: '\\25BC  '; }
  summary:hover { background: var(--vscode-list-hoverBackground); }
  textarea { width: 100%; box-sizing: border-box; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: none; border-top: 1px solid var(--vscode-panel-border); padding: 4px; resize: vertical; font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); }
  .hint { font-size: 0.84em; color: var(--vscode-descriptionForeground); margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--vscode-panel-border); line-height: 1.6; }
  kbd { background: var(--vscode-keybindingLabel-background, #ddd); border: 1px solid var(--vscode-keybindingLabel-border, #aaa); padding: 1px 5px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
</style>
</head>
<body>
<button id="fileBtn">&#x1F4C2; Select .txt file</button>
<div class="delays">
  <label>Min delay:</label><input type="number" id="minDelay" value="30" min="0">
  <label>Max delay:</label><input type="number" id="maxDelay" value="120" min="0">
</div>
${slots}
<div class="hint">
  Press <kbd>${mod}-P</kbd> to pause/resume
</div>
<script>
  const vscode = acquireVsCodeApi();

  function getTexts() {
    return Array.from({length: 9}, (_, i) => document.getElementById('slot' + (i + 1)).value);
  }

  function saveState() {
    vscode.postMessage({
      command: 'saveState',
      texts: getTexts(),
      minDelay: parseInt(document.getElementById('minDelay').value) || 30,
      maxDelay: parseInt(document.getElementById('maxDelay').value) || 120
    });
  }

  document.getElementById('fileBtn').addEventListener('click', () => {
    vscode.postMessage({ command: 'openFile' });
  });

  for (let i = 1; i <= 9; i++) {
    document.getElementById('slot' + i).addEventListener('input', saveState);
  }
  document.getElementById('minDelay').addEventListener('change', saveState);
  document.getElementById('maxDelay').addEventListener('change', saveState);

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.command === 'fillSlots') {
      msg.texts.forEach((text, i) => {
        const el = document.getElementById('slot' + (i + 1));
        if (el) el.value = text;
      });
      saveState();
    } else if (msg.command === 'restoreState') {
      if (msg.texts) {
        msg.texts.forEach((text, i) => {
          const el = document.getElementById('slot' + (i + 1));
          if (el) el.value = text;
        });
      }
      if (msg.minDelay !== undefined) document.getElementById('minDelay').value = msg.minDelay;
      if (msg.maxDelay !== undefined) document.getElementById('maxDelay').value = msg.maxDelay;
    }
  });
</script>
</body>
</html>`;
    }
}
