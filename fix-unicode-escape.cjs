const fs = require('fs');
const path = require('path');
const util = require('util');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const TARGET_DIRS = [
    'app',
    'components',
    'lib',
    'utils'
];

async function findFiles(dir, pattern) {
    const files = [];
    const entries = await readdir(dir);

    for (const entry of entries) {
        if (entry === 'node_modules' || entry === '.git' || entry === '.next') continue;

        const entryPath = path.join(dir, entry);
        const stats = await stat(entryPath);

        if (stats.isDirectory()) {
            const subFiles = await findFiles(entryPath, pattern);
            files.push(...subFiles);
        } else if (pattern.test(entryPath)) {
            files.push(entryPath);
        }
    }
    return files;
}

async function fixUnicodeEscape() {
    console.log('Starting fix for unicode escape characters...');
    const filesToFix = [];

    let allFiles = [];
    for (const dir of TARGET_DIRS) {
        const tsxFiles = await findFiles(path.join(__dirname, dir), /\.tsx$/);
        const tsFiles = await findFiles(path.join(__dirname, dir), /\.ts$/);
        allFiles.push(...tsxFiles, ...tsFiles);
    }

    for (const filePath of allFiles) {
        try {
            let content = await readFile(filePath, 'utf8');
            const originalContent = content;

            // Replace ";\n" followed by any number of newlines with ";\n"
            // This targets the problematic sequence more broadly
            content = content.replace(/";\s*\n+/g, '";\n');

            if (content !== originalContent) {
                await writeFile(filePath, content, 'utf8');
                filesToFix.push(filePath);
                console.log(`Fixed: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error processing ${filePath}: ${error.message}`);
        }
    }
    console.log(`Finished fixing. Total files fixed: ${filesToFix.length}`);
}

fixUnicodeEscape().catch(console.error);
