const fs = require('fs');
const file = 'apps/web/app/(customer)/layout.tsx';
let content = fs.readFileSync(file, 'utf8');
const drawerRegex = /\{\/\* Sliding Dynamic AI Assistant Drawer \*\/\}[\s\S]*?\{\/\* Floating AI Concierge Launcher removed — users access via \/concierge page \*\/\}/;
const match = content.match(drawerRegex);
if(match) {
  console.log("Match found! Length: " + match[0].length);
  content = content.replace(drawerRegex, '');
  fs.writeFileSync(file, content);
  console.log("Replaced and saved!");
} else {
  console.log("No match found!");
}
