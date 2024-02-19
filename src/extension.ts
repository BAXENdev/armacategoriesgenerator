import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Extension initialization
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('a3cg.generateCategories', (uri) => {
        // console.log("Test",uri.path);
        if (uri && uri.fsPath) {
            generateCategories(uri.fsPath);
        }
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.defineTag', () => {
        defineTag();
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.enableTagClass', () => {
        setAddTagClass(true);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.disableTagClass', () => {
        setAddTagClass(false);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.togglePreinit', (uri) => {
        if (uri && uri.fsPath) {
            toggleFilePreinit(uri.fsPath);
        }
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.togglePostinit', (uri) => {
        if (uri && uri.fsPath) {
            toggleFilePostinit(uri.fsPath);
        }
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.hideA3CGmenu', () => {
        setHideA3CGmenu(true);
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('a3cg.unhideA3CGmenu', () => {
        setHideA3CGmenu(false);
    });
    context.subscriptions.push(disposable);
}

// Write the categories file
function generateCategories(folderPath: string) {
    const categoriesFilePath = path.join(folderPath, 'categories.hpp');
    const categoriesContent: string[] = [""];
    const doAddTagClass = vscode.workspace.getConfiguration().get('a3cg.addTagClass', false);

    let tagPrefix = "";
    if (doAddTagClass) {
        const rootFolder = path.basename(folderPath);
        const tag = vscode.workspace.getConfiguration().get('a3cg.tag', '');
        const tagComponent = (tag === '' ? '' : (tag + '_')) + capitalizeFirstLetter(rootFolder);
        categoriesContent.push(`class ${tagComponent} {`);
        tagPrefix = "    ";
    };

    function processFolder(folderPath: string, folderNames: string[]) {
        const relativePath = vscode.workspace.asRelativePath(folderPath).replaceAll("/","\\");
        const className = folderNames.join('') || "Root"; 
        
        categoriesContent.push(`${tagPrefix}class ${className} {
    file = "${relativePath}";`);

        const files = fs.readdirSync(folderPath);

        const preinitFiles: string[] = vscode.workspace.getConfiguration().get('a3cg.preinitFiles', []);
        const postinitFiles: string[] = vscode.workspace.getConfiguration().get('a3cg.postinitFiles', []);

        console.log("Preinit: ", preinitFiles);
        console.log("Postinit: ", postinitFiles);
        files.forEach(file => {
            console.log("test",[folderPath,file,files,preinitFiles,postinitFiles]);

            const extension = path.extname(file);
            const fileName = path.basename(file, path.extname(file));
            let fileClassName = "";
            let classBrackets = "";
            let bracketContent: string[] = [];

            console.log("File: ", (folderPath + "\\" + file));
            if (extension !== '.sqf') {
                // do nothing
            } else if (fileName.startsWith("fn_")) {
                fileClassName = fileName.slice("fn_".length);
                if (fileName.includes("preinit") || preinitFiles.includes((folderPath + "\\" + file))) {
                    bracketContent.push("preInit=1;");
                };
                if (fileName.includes("postinit") || postinitFiles.includes((folderPath + "\\" + file))) {
                    bracketContent.push("postInit=1;");
                };
                
                if (bracketContent.length === 0) {
                    classBrackets = "{};";
                } else {
                    classBrackets = `{ ${bracketContent.join(' ')} };`;
                };
            } 
            // else {
            //     const relativeFilepath = vscode.workspace.asRelativePath(file).replaceAll("/","\\");
            //     fileClassName = fileName;
            //     if (fileName.includes("preinit")) {
            //         bracketContent.push("preInit=1;");
            //     };
            //     if (fileName.includes("postinit")) {
            //         bracketContent.push("postInit=1;");
            //     };

                

            //     if (bracketContent.length === 0) {
            //         classBrackets = "{};";
            //     } else {
            //         classBrackets = `{ ${bracketContent.join(' ')} };`;
            //     };
            // };

            if (fileClassName !== "") {
                categoriesContent.push(`${tagPrefix}    class ${fileClassName} ${classBrackets}`);
            };
        });

        categoriesContent.push(`${tagPrefix}};\n`);

        const subFolders = files
            .filter(file => fs.statSync(path.join(folderPath, file)).isDirectory());

        subFolders.forEach(subFolder => {
            const newFolderPath = path.join(folderPath, subFolder)
            const folderName = capitalizeFirstLetter(path.basename(newFolderPath));
            processFolder(newFolderPath, folderNames.concat([folderName]));
        });
    }

    processFolder(folderPath, []);

    // A final bracket for adding the tag class around the rest of the config
    if (doAddTagClass) {
        categoriesContent.push('};\n');
    };

    // Final file write out
    fs.writeFileSync(categoriesFilePath, categoriesContent.join('\n'));
}

// Need a full function for capitalizing the first letter. Interesting one liner generated by GPT
function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function for writing tag to workspace configuration
function defineTag() {
    vscode.window.showInputBox({
        placeHolder: 'Enter your tag'
    }).then((tag) => {
        if (tag) {
            // Save the tag to configuration
            vscode.workspace.getConfiguration().update('a3cg.tag', tag, vscode.ConfigurationTarget.Workspace);
        }
    });
}

function setAddTagClass (setting: boolean) {
    vscode.workspace.getConfiguration().update('a3cg.addTagClass', setting, vscode.ConfigurationTarget.Workspace);
}

function toggleFilePreinit (filepath: string) {
    let filepaths: string[] = vscode.workspace.getConfiguration().get('a3cg.preinitFiles', []);
    if (filepaths.includes(filepath)) {
        filepaths = filepaths.filter((x) => x !== filepath);
    } else {
        filepaths.push(filepath);
    };
    vscode.workspace.getConfiguration().update('a3cg.preinitFiles', filepaths, vscode.ConfigurationTarget.Workspace);
}

function toggleFilePostinit (filepath: string) {
    let filepaths: string[] = vscode.workspace.getConfiguration().get('a3cg.postinitFiles', []);
    if (filepaths.includes(filepath)) {
        filepaths = filepaths.filter((x) => x !== filepath);
    } else {
        filepaths.push(filepath);
    };
    vscode.workspace.getConfiguration().update('a3cg.postinitFiles', filepaths, vscode.ConfigurationTarget.Workspace);
}

function setHideA3CGmenu (setting: boolean) {
    vscode.workspace.getConfiguration().update('a3cg.hideA3CGmenu', setting, vscode.ConfigurationTarget.Workspace);
}
