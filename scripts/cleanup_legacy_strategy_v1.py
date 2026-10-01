from pathlib import Path
p=Path('app/page.tsx')
s=p.read_text()
start=s.index("const STRATEGY_MODES = [")
end=s.index("const SIMPLE_1688_TASKS = [")
s=s[:start]+s[end:]
s=s.replace("  product_url:string; notes:string; strategy_mode:'none'|'simple'|'full'\n", "  product_url:string; notes:string\n")
s=s.replace(",strategy_mode:'simple'", "")
p.write_text(s)
