from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()
s=s.replace("import { STANDARD_TEMPLATE } from '@/src/lib/template'\n","")
marker="  async function upgradeSelectedProjectTemplate() {"
if marker in s:
    start=s.index(marker)
    end=s.index("  async function addTask(stageId:number) {", start)
    s=s[:start]+s[end:]
s=s.replace(" onUpgradeTemplate={upgradeSelectedProjectTemplate}","")
s=s.replace(" onDeleteTask:(id:number)=>void; onDeleteProject:(p:Project)=>void; onUpgradeTemplate:()=>void; onCreateExecutionTemplate:()=>void;", " onDeleteTask:(id:number)=>void; onDeleteProject:(p:Project)=>void; onCreateExecutionTemplate:()=>void;")
p.write_text(s)
