"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
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
exports.activate = activate;
function generateCategories(folderPath) {
    const categoriesFilePath = path.join(folderPath, 'categories.hpp');
    const categoriesContent = [""];
    const doAddTagClass = vscode.workspace.getConfiguration().get('a3cg.addTagClass', false);
    let tagPrefix = "";
    if (doAddTagClass) {
        const rootFolder = path.basename(folderPath);
        const tag = vscode.workspace.getConfiguration().get('a3cg.tag', '');
        const tagComponent = (tag === '' ? '' : (tag + '_')) + capitalizeFirstLetter(rootFolder);
        categoriesContent.push(`class ${tagComponent} {`);
        tagPrefix = "    ";
    }
    ;
    function processFolder(folderPath, folderNames) {
        const relativePath = vscode.workspace.asRelativePath(folderPath).replaceAll("/", "\\");
        const className = folderNames.join('') || "Root";
        categoriesContent.push(`${tagPrefix}class ${className} {
    file = "${relativePath}";`);
        const files = fs.readdirSync(folderPath);
        const preinitFiles = vscode.workspace.getConfiguration().get('a3cg.preinitFiles', []);
        const postinitFiles = vscode.workspace.getConfiguration().get('a3cg.postinitFiles', []);
        files.forEach(file => {
            console.log("test", [folderPath, file, files, preinitFiles, postinitFiles]);
            const extension = path.extname(file);
            const fileName = path.basename(file, path.extname(file));
            let fileClassName = "";
            let classBrackets = "";
            let bracketContent = [];
            if (extension !== '.sqf') {
                // do nothing
            }
            else if (fileName.startsWith("fn_")) {
                fileClassName = fileName.slice("fn_".length);
                if (fileName.includes("preinit") || preinitFiles.includes((folderPath + "\\" + file))) {
                    bracketContent.push("preInit=1;");
                }
                ;
                if (fileName.includes("postinit") || postinitFiles.includes((folderPath + "\\" + file))) {
                    bracketContent.push("postInit=1;");
                }
                ;
                if (bracketContent.length === 0) {
                    classBrackets = "{};";
                }
                else {
                    classBrackets = `{ ${bracketContent.join(' ')} };`;
                }
                ;
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
            }
            ;
        });
        categoriesContent.push(`${tagPrefix}};\n`);
        const subFolders = files
            .filter(file => fs.statSync(path.join(folderPath, file)).isDirectory());
        subFolders.forEach(subFolder => {
            const newFolderPath = path.join(folderPath, subFolder);
            const folderName = capitalizeFirstLetter(path.basename(newFolderPath));
            processFolder(newFolderPath, folderNames.concat([folderName]));
        });
    }
    processFolder(folderPath, []);
    if (doAddTagClass) {
        categoriesContent.push('};\n');
    }
    ;
    fs.writeFileSync(categoriesFilePath, categoriesContent.join('\n'));
}
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
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
function setAddTagClass(setting) {
    vscode.workspace.getConfiguration().update('a3cg.addTagClass', setting, vscode.ConfigurationTarget.Workspace);
}
function toggleFilePreinit(filepath) {
    let filepaths = vscode.workspace.getConfiguration().get('a3cg.preinitFiles', []);
    if (filepaths.includes(filepath)) {
        filepaths = filepaths.filter((x) => x !== filepath);
    }
    else {
        filepaths.push(filepath);
    }
    ;
    vscode.workspace.getConfiguration().update('a3cg.preinitFiles', filepaths, vscode.ConfigurationTarget.Workspace);
}
function toggleFilePostinit(filepath) {
    let filepaths = vscode.workspace.getConfiguration().get('a3cg.postinitFiles', []);
    if (filepaths.includes(filepath)) {
        filepaths = filepaths.filter((x) => x !== filepath);
    }
    else {
        filepaths.push(filepath);
    }
    ;
    vscode.workspace.getConfiguration().update('a3cg.postinitFiles', filepaths, vscode.ConfigurationTarget.Workspace);
}
function setHideA3CGmenu(setting) {
    vscode.workspace.getConfiguration().update('a3cg.hideA3CGmenu', setting, vscode.ConfigurationTarget.Workspace);
}
//# sourceMappingURL=extension.js.map