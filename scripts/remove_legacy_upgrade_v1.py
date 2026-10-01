from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()
s=s.replace("import { STANDARD_TEMPLATE } from '@/src/lib/template'\n","")
marker="  async function upgradeSelectedProjectTemplate() {"
if marker in s:
    start=s.index(marker)
    end=s.index("  async function addTask(stageId:number) {", start)
    s=s[:start]+s[end:]
# The legacy UI trigger may already have been removed by a prior cleanup.
# Do not fail when the target is already absent.
p.write_text(s)
