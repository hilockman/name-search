import csv
import codecs
from get_name_score import get_name_postfixs,compute_name_score
import sys
import threading
import time 
import threadpool

import user_config

# 先给文件写一个Windows系统用来识别编码的头(UTF-8 BOM)
curr_idx = 0
all_count = 0
fout = None
outfile = None

def compute_and_writefile(name_postfix):
    try:
        global fout
        name_data = compute_name_score(name_postfix)
        write_to_file(fout, name_data)
    except Exception as e:
        print('error, ', e, name_postfix)
        exit()		
	
		
lock = threading.Lock()
def write_to_file(fout, name_data):
    lock.acquire()
    global curr_idx, all_count
    curr_idx += 1
    print("%d/%d" % (curr_idx, all_count)),
    print("\t".join((name_data['full_name'],
                     "姓名八字评分=" + str(name_data['bazi_score']),
                     "姓名五格评分=" + str(name_data['wuge_score']),
                     "总分=" + str(name_data['total_score'])
                     )))		   
    fout.writerow([str(name_data['full_name']), str(name_data['bazi_score']), str(name_data['wuge_score']), str(name_data['total_score'])])
    global outfile
    outfile.flush()
    lock.release()
	
def process():
    """计算并且将结果输出到文件
    """
    # 获得所有可用的名字列表
    all_name_postfixs = get_name_postfixs()
    #all_name_postfixs = ['国荣']
    
    global all_count
    all_count = len(all_name_postfixs)
     
    pool = threadpool.ThreadPool(1)
    requests = threadpool.makeRequests(compute_and_writefile, all_name_postfixs) 
    [pool.putRequest(req) for req in requests]
    pool.wait()  



if __name__ == "__main__":
    print("sys.getdefaultencoding() = " + sys.getdefaultencoding());
    print("begin................................")
    output_fpath = "./outputs/%s.csv" % user_config.setting["output_fname"]
    with open(output_fpath, 'wb') as outfile:
      outfile.write(codecs.BOM_UTF8)
	  	
    # 输出文件路径
    outfile = open(output_fpath, 'a', newline='', encoding='UTF-8')
    fout = csv.writer(outfile, dialect='excel')	
    fout.writerow(['full_name', 'bazi_score', 'wuge_score', 'total_score'])
    process()
    outfile.close()  
	
    print("over................................")	