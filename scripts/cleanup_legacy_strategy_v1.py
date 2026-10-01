from pathlib import Path
import re
p=Path('app/page.tsx')
s=p.read_text()
start=s.index("const STRATEGY_MODES = [")
end=s.index("const SIMPLE_1688_TASKS = [")
s=s[:start]+s[end:]
s=re.sub(r";\s*strategy_mode:'none'\|'simple'\|'full'", "", s)
s=re.sub(r",\s*strategy_mode:'simple'", "", s)
p.write_text(s)
