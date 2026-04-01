import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = 'c:/Users/Mr. Tushar/Documents/Arcmat/arcmat-backend';

function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                getFiles(filePath, fileList);
            }
        } else if (filePath.endsWith('.js')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const allJsFiles = getFiles(rootDir);
let issuesFound = 0;

allJsFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"](\..*?)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const fullImportPath = path.resolve(path.dirname(file), importPath);
        
        // Check if file exists with EXACT casing
        const dir = path.dirname(fullImportPath);
        const base = path.basename(fullImportPath);
        
        if (fs.existsSync(dir)) {
            const filesInDir = fs.readdirSync(dir);
            if (!filesInDir.includes(base)) {
                // If it exists in some casing but NOT the one requested
                const actualFile = filesInDir.find(f => f.toLowerCase() === base.toLowerCase());
                if (actualFile) {
                    console.log(`ISSUE in ${path.relative(rootDir, file)}:`);
                    console.log(`  Reference: ${importPath}`);
                    console.log(`  Actual file on disk: ${actualFile}`);
                    console.log(`-----------------------------------`);
                    issuesFound++;
                }
            }
        }
    }
});

if (issuesFound === 0) {
    console.log("No further case-sensitivity issues found! Your imports are clean.");
} else {
    console.log(`Found ${issuesFound} casing issues that need fixing.`);
}
