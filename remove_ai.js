const fs = require('fs');
const file = 'apps/web/app/(customer)/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove isAiOpen state
content = content.replace(/const \[isAiOpen, setIsAiOpen\] = useState\(false\);\n\s*/g, '');

// 2. Remove AI Drawer Event Listener
content = content.replace(/\/\/ Listener to open AI Concierge chat dynamically\s*useEffect\(\(\) => \{\s*const handleOpen = \(\) => \{\s*toggleAiDrawer\(true\);\s*\};\s*window\.addEventListener\("open-concierge", handleOpen\);\s*return \(\) => \{\s*window\.removeEventListener\("open-concierge", handleOpen\);\s*\};\s*\}, \[\]\);\n\s*/g, '');

// 3. Update Scroll Lock
content = content.replace(/if \(isAiOpen \|\| isBagDrawerOpen\) \{/g, 'if (isBagDrawerOpen) {');
content = content.replace(/\}, \[isAiOpen, isBagDrawerOpen\]\);/g, '}, [isBagDrawerOpen]);');

// 4. Remove toggleBagDrawer AI closing logic
content = content.replace(/if \(open\) setIsAiOpen\(false\); \/\/ Close AI drawer if opening Bag\s*/g, '');

// 5. Remove chatLog state up to handlePresetAction end
const chatLogRegex = /const \[chatLog, setChatLog\] = useState<Array<ChatMessage>>\(\[\s*\{[\s\S]*?const handlePresetAction = \([\s\S]*?\}, 600\);\s*\};\n\s*/;
content = content.replace(chatLogRegex, '');

// 6. Remove toggleAiDrawer
const toggleAiDrawerRegex = /const toggleAiDrawer = \([\s\S]*?\};\n\s*/;
content = content.replace(toggleAiDrawerRegex, '');

// 7. Remove handleFeedback, handleDispatchCuration, handleSendMessage
const feedbackRegex = /const handleFeedback = \([\s\S]*?handleSendMessage = \([\s\S]*?\}, 800\);\s*\};\n\s*/;
content = content.replace(feedbackRegex, '');

// 8. Remove Drawer JSX
const drawerRegex = /\{\/\* Sliding Dynamic AI Assistant Drawer \*\/\}[\s\S]*?\{\/\* Floating AI Concierge Launcher removed — users access via \/concierge page \*\/}\n\s*/;
content = content.replace(drawerRegex, '');

// 9. Remove AI Concierge Desktop Nav Link
const desktopNavLinkRegex = /<Link\s+href="\/concierge"[\s\S]*?✦ AI Concierge\s*<\/Link>\n\s*/;
content = content.replace(desktopNavLinkRegex, '');

// 10. Remove AI Concierge Mobile Nav Link
const mobileNavLinkRegex = /<Link\s+href="\/concierge"[\s\S]*?✦ AI Concierge\s*<\/Link>\n\s*/;
content = content.replace(mobileNavLinkRegex, '');

fs.writeFileSync(file, content);
console.log("Done");
