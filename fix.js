const fs = require('fs');
let f = fs.readFileSync('src/app/player/index.tsx', 'utf8');

f = f.replace(/import \{ useEffect, useState \} from 'react';/g, "import { useEffect, useState, useRef } from 'react';\n\nconst generateId = () => Math.random().toString(36).substring(2, 11);");
f = f.replace(/const \[prevClassAndLevel, setPrevClassAndLevel\] = useState<string>\(''\);/g, "const prevClassAndLevel = useRef<string>('');");
f = f.replace(/if \(prevClassAndLevel === currentClassAndLevel\)/g, "if (prevClassAndLevel.current === currentClassAndLevel)");
f = f.replace(/setPrevClassAndLevel\(currentClassAndLevel\);/g, "prevClassAndLevel.current = currentClassAndLevel;");
f = f.replace(/, prevClassAndLevel\]\)/g, "] /* prevClassAndLevel removed */)");
f = f.replace(/Date\.now\(\)/g, "generateId()");
f = f.replace(/[ \t]*\/\/ eslint-disable-next-line react-hooks\/purity\r?\n/g, "");
f = f.replace(/catch \(e\)/g, "catch");

fs.writeFileSync('src/app/player/index.tsx', f);
console.log('Fixed player/index.tsx');
