import openpyxl,sys,re
wb=openpyxl.load_workbook(sys.argv[1]); ws=wb.active
DMG=re.compile(r"\b(deal|deals|dealing|damage to|hit one target|hits for|explode|execute|throw|attack that many times|damage based|damage acordingly|deal that much)\b",re.I)
for r in range(6,126):
    cid,name,txt,cls,rar,typ,tgt=[ws.cell(r,c).value for c in range(1,8)]
    trig = typ=='Attack' or bool(DMG.search(txt))
    print(cid, name, typ, tgt, 'DMG' if trig else '-', '|', txt[:90])
