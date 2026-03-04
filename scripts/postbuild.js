import fs from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';

const copyFile = async function (srcFilePath, destFilePath) {
  const fileName = path.basename(srcFilePath);
  try {
    const srcPath = path.resolve(process.cwd(), srcFilePath);
    const destPath = path.resolve(process.cwd(), 'dist/ngx-editor', destFilePath);
    await fs.copyFile(srcPath, destPath);
    console.log(pc.green(`- File Copied: ${fileName}`));
  } catch (err) {
    console.log(pc.red(`Error while copying ${fileName}`), err);
  }
};

copyFile('README.md', 'README.md');
copyFile('CHANGELOG.md', 'CHANGELOG.md');
copyFile('LICENSE', 'LICENSE');

// FEATURE23-FORK: Rename the package for publishing under the @feature23 scope.
// The source package.json uses "ngx-editor" so that ng-packagr resolves
// secondary entry points (ngx-editor/utils, ngx-editor/schema, etc.) correctly.
const distPkgPath = path.resolve(process.cwd(), 'dist/ngx-editor/package.json');
try {
  const pkg = JSON.parse(await fs.readFile(distPkgPath, 'utf-8'));
  pkg.name = '@feature23/ngx-editor';
  await fs.writeFile(distPkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(pc.green('- Package renamed to @feature23/ngx-editor'));
} catch (err) {
  console.log(pc.red('Error renaming package'), err);
}
