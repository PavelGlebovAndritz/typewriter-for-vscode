import * as vscode from 'vscode';
import {type, pause} from './humanTyper.js';
import {TypewriterPanelProvider} from './typewriterPanelProvider.js';

let typewriterBuffer:string;

export function activate(context: vscode.ExtensionContext) {

    const panelProvider = new TypewriterPanelProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(TypewriterPanelProvider.viewType, panelProvider)
    );

    for (let i = 1; i <= 9; i++) {
        const slot = i;
        context.subscriptions.push(
            vscode.commands.registerCommand(`typewriter.playSlot${slot}`, () => {
                const text = panelProvider.getSlotText(slot - 1);
                if (!text) { return; }
                const delays = panelProvider.getDelays();
                type(text, delays.min, delays.max);
            })
        );
    }

    let playTypewriterCmd = vscode.commands.registerCommand('typewriter.playback', () => {


        let minSpeed = vscode.workspace.getConfiguration('typewriter').get<number>('TypingMinSpeed') | 30;
        let maxSpeed = vscode.workspace.getConfiguration('typewriter').get<number>('TypingMaxSpeed') | 120;
        type(typewriterBuffer, minSpeed, maxSpeed);
    });

    let setTypewriterCmd = vscode.commands.registerCommand('typewriter.setTypewriter', () => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        var selection = editor.selection;
        typewriterBuffer = editor.document.getText(selection);
    })

    let pausePlaybackCmd = vscode.commands.registerCommand('typewriter.pause', () => {
        pause();
    });


    context.subscriptions.push(playTypewriterCmd);
    context.subscriptions.push(setTypewriterCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {
}