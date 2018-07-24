import csv
import codecs
# 先给文件写一个Windows系统用来识别编码的头(UTF-8 BOM)
with open('./outputs/tetcsv.csv', 'wb') as outfile:
    outfile.write(codecs.BOM_UTF8)

with open('./outputs/tetcsv.csv', 'a', newline='', encoding='UTF-8') as outfile:
    writer = csv.writer(outfile, dialect='excel')	
    # 写入一行
    writer.writerow(["名称", "分数"])
