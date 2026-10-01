from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()
s=s.replace("import { STANDARD_TEMPLATE } from '@/src/lib/template'\n","")
start=s.index("  async function upgradeSelectedProjectTemplate() {")
end=s.index("  async function addTask(stageId:number) {", start)
s=s[:start]+s[end:]
p.write_text(s)
