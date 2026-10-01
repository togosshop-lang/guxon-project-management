from pathlib import Path
import re
p=Path('app/page.tsx')
s=p.read_text()
s=s.replace("import { STANDARD_TEMPLATE } from '@/src/lib/template'\n","")
start=s.index("  async function upgradeSelectedProjectTemplate() {")
end=s.index("  async function addTask(stageId:number) {", start)
s=s[:start]+s[end:]
s,n=re.subn(r'<button[^>]*onClick=\{upgradeSelectedProjectTemplate\}[^>]*>.*?</button>', '', s, flags=re.S)
assert n>=1, 'legacy upgrade button not found'
p.write_text(s)
