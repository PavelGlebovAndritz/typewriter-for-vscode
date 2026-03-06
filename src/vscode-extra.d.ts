// Type augmentation for VS Code APIs not present in the installed vscode@1.1.37 package.
// These APIs were introduced in VS Code 1.49+.
// The empty export makes this a module, enabling declaration merging instead of shadowing.
export {};

declare module 'vscode' {

    /**
     * Displays HTML content, message passing between extension and webview.
     */
    interface Webview {
        options: { enableScripts?: boolean; localResourceRoots?: Uri[]; enableCommandUris?: boolean };
        html: string;
        onDidReceiveMessage: Event<any>;
        postMessage(message: any): Thenable<boolean>;
        asWebviewUri(localResource: Uri): Uri;
        cspSource: string;
    }

    /**
     * Options for showing an open file/folder dialog.
     */
    interface OpenDialogOptions {
        defaultUri?: Uri;
        openLabel?: string;
        canSelectFiles?: boolean;
        canSelectFolders?: boolean;
        canSelectMany?: boolean;
        filters?: { [name: string]: string[] };
        title?: string;
    }

    /**
     * A webview view is a view that is displayed in the sidebar or panel
     * and renders HTML content.
     */
    interface WebviewView {
        readonly viewType: string;
        readonly webview: Webview;
        title?: string;
        description?: string;
        readonly onDidDispose: Event<void>;
        readonly visible: boolean;
        readonly onDidChangeVisibility: Event<void>;
        show(preserveFocus?: boolean): void;
    }

    /**
     * Additional information the webview view being resolved.
     */
    interface WebviewViewResolveContext<T = unknown> {
        readonly state: T | undefined;
    }

    /**
     * Provider for webview views.
     */
    interface WebviewViewProvider {
        resolveWebviewView(
            webviewView: WebviewView,
            context: WebviewViewResolveContext,
            token: CancellationToken
        ): Thenable<void> | void;
    }

    namespace window {
        /**
         * Show a file open dialog that allows the user to select a file.
         */
        function showOpenDialog(options?: OpenDialogOptions): Thenable<Uri[] | undefined>;

        /**
         * Register a new provider for webview views.
         */
        function registerWebviewViewProvider(
            viewId: string,
            provider: WebviewViewProvider,
            options?: {
                readonly webviewOptions?: {
                    readonly retainContextWhenHidden?: boolean;
                };
            }
        ): Disposable;
    }
}
