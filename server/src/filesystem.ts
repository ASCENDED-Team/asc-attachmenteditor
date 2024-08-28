import * as fs from 'fs';
import * as path from 'path';

const pluginPath = path.join(process.cwd(), 'src', 'plugins/asc-attachmenteditor/shared/prop_configs');

export function saveConfig(name: string, data: any): boolean {
    try {
        if (!fs.existsSync(pluginPath)) {
            fs.mkdirSync(pluginPath, { recursive: true });
        }
        const filePath = path.join(pluginPath, `${name}.json`);

        // Create a new sorted editorObject
        const sortedEditorObject = {
            prop: data.editorObject.prop,
            boneId: data.editorObject.boneId,
            animationDictionary: data.editorObject.animationDictionary,
            animationName: data.editorObject.animationName,
            animationFlag: data.editorObject.animationFlag,
        };

        // Create the sorted data object
        const sortedData = {
            editorObject: sortedEditorObject,
            posData: data.posData,
        };

        fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

export function loadConfig(name: string): any | null {
    try {
        const filePath = path.join(pluginPath, `${name}.json`);
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const loadedData = JSON.parse(fileContent);

            const sortedEditorObject = {
                prop: loadedData.editorObject.prop,
                boneId: loadedData.editorObject.boneId,
                animationDictionary: loadedData.editorObject.animationDictionary,
                animationName: loadedData.editorObject.animationName,
                animationFlag: loadedData.editorObject.animationFlag,
            };

            return {
                editorObject: sortedEditorObject,
                posData: loadedData.posData,
            };
        }
        return null;
    } catch (error) {
        console.error('Error loading config:', error);
        return null;
    }
}

export function getSavedConfigs(): string[] {
    try {
        if (!fs.existsSync(pluginPath)) {
            return [];
        }
        return fs
            .readdirSync(pluginPath)
            .filter((file) => file.endsWith('.json'))
            .map((file) => path.basename(file, '.json'));
    } catch (error) {
        console.error('Error getting saved configs:', error);
        return [];
    }
}

export async function deleteConfig(configName: string) {
    const filePath = path.join(pluginPath, `${configName}.json`);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting config:', error);
        return false;
    }
}
