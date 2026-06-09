const fs = require('fs');
const file = 'apps/web/app/(customer)/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const s1 = "{/* Sliding Dynamic AI Assistant Drawer */}";
const e1 = "{/* Floating AI Concierge Launcher removed — users access via /concierge page */}";
const i1 = content.indexOf(s1);
const i2 = content.indexOf(e1);
if (i1 > -1 && i2 > -1) {
  content = content.substring(0, i1) + content.substring(i2 + e1.length);
}

const s2 = "const [chatLog, setChatLog] = useState<Array<ChatMessage>>([";
const e2 = "    }, 600);\n  };\n";
const i3 = content.indexOf(s2);
const i4 = content.indexOf(e2, i3);
if (i3 > -1 && i4 > -1) {
  content = content.substring(0, i3) + content.substring(i4 + e2.length);
}

const s3 = "// Listener to open AI Concierge chat dynamically";
const e3 = "  }, []);\n";
const i5 = content.indexOf(s3);
const i6 = content.indexOf(e3, i5);
if (i5 > -1 && i6 > -1) {
  content = content.substring(0, i5) + content.substring(i6 + e3.length);
}

const s4 = "const toggleAiDrawer = (open: boolean) => {";
const e4 = "    }\n  };\n";
const i7 = content.indexOf(s4);
const i8 = content.indexOf(e4, i7);
if (i7 > -1 && i8 > -1) {
  content = content.substring(0, i7) + content.substring(i8 + e4.length);
}

const s5 = "const handleFeedback = (idx: number, type: \"like\" | \"dislike\") => {";
const e5 = "    }, 800);\n  };\n";
const i9 = content.indexOf(s5);
const i10 = content.indexOf(e5, i9);
if (i9 > -1 && i10 > -1) {
  content = content.substring(0, i9) + content.substring(i10 + e5.length);
}

content = content.replace("if (isAiOpen || isBagDrawerOpen) {", "if (isBagDrawerOpen) {");
content = content.replace("}, [isAiOpen, isBagDrawerOpen]);", "}, [isBagDrawerOpen]);");
content = content.replace(/const \[isAiOpen, setIsAiOpen\] = useState\(false\);\n\s*/, '');
content = content.replace(/if \(open\) setIsAiOpen\(false\); \/\/ Close AI drawer if opening Bag\n\s*/, '');

fs.writeFileSync(file, content);
