# coding:UTF-8

"""
对http://life.main.com/xingming.asp地址的姓名测试表单进行自动提交参数，获取结果页面中的分数结果

Created on 2016年10月23日

@author: crazyant.net
""" 

import urllib 
#import urllib2 
from urllib import parse
#from urllib.request import urlopen
from urllib import request, parse

from bs4 import BeautifulSoup 
import re
import sys 
import threading
import time 
import threadpool

import user_config
import sys_config
import imp



curr_idx = 0
all_count = 0
fout = None

def get_name_postfixs():
    """根据是否使用单字和用户配置的性别参数，获取所有的名字列表
    """
    target_name_postfixs = set()
    
    # 是否有单字限制
    has_limit_word = False
    limit_word = user_config.setting.get("limit_world")
    if limit_word is not None and len(limit_word) > 0:
        has_limit_word = True
    
    has_post_limit_world = False
    post_limit_world = user_config.setting.get("post_limit_world")
    if post_limit_world is not None and len(post_limit_world) > 0:
        has_post_limit_world = True
		
    if has_limit_word:
        if user_config.setting["sex"] == "男":
            fpath_input = sys_config.FPATH_DICTFILE_BOYS_SINGLE
        elif user_config.setting["sex"] == "女":
            fpath_input = sys_config.FPATH_DICTFILE_GIRLS_SINGLE
        
        print("has limit word, fpath_input=%s" % fpath_input)
        
        for line in open(fpath_input,'r',encoding='utf-8'):
                #print("line : "+line)
                iter_name = str(line).strip()
                target_name_postfixs.add("%s%s" % (limit_word, iter_name))
    elif has_post_limit_world:
        if user_config.setting["sex"] == "男":
            fpath_input = sys_config.FPATH_DICTFILE_BOYS_SINGLE
        elif user_config.setting["sex"] == "女":
            fpath_input = sys_config.FPATH_DICTFILE_GIRLS_SINGLE
        
        print("has post limit word, fpath_input=%s" % fpath_input)
        
        for line in open(fpath_input,'r',encoding='utf-8'):
                #print("line : "+line)
                iter_name = str(line).strip()
                target_name_postfixs.add("%s%s" % (iter_name, post_limit_world))				
    else:
        if user_config.setting["sex"] == "男":
            fpath_input = sys_config.FPATH_DICTFILE_BOYS_DOUBLE
        elif user_config.setting["sex"] == "女":
            fpath_input = sys_config.FPATH_DICTFILE_GIRLS_DOUBLE

        for line in open(fpath_input):
                iter_name = str(line).strip()
                target_name_postfixs.add(iter_name)
    
    return target_name_postfixs


def compute_name_score(name_postfix):
    """调用接口，执行计算，返回结果
    """
    result_data = {}
    params = {}
    
    # 日期类型，0表示公历，1表示农历
    params['data_type'] = "0"
    params['year'] = "%s" % str(user_config.setting["year"])
    params['month'] = "%s" % str(user_config.setting["month"])
    params['day'] = "%s" % str(user_config.setting["day"])
    params['hour'] = "%s" % str(user_config.setting["hour"])
    params['minute'] = "%s" % str(user_config.setting["minute"])
    params['pid'] = "%s" % str(user_config.setting["area_province"])
    params['cid'] = "%s" % str(user_config.setting["area_region"])
    # 喜用五行，0表示自动分析，1表示自定喜用神
    params['wxxy'] = "0"
    params['xishen'] = "金"
    params['yongshen'] = "金"	
    params['xing'] = "%s" % (user_config.setting["name_prefix"])
    params['ming'] = name_postfix
    # 表示女，1表示男
    if user_config.setting["sex"] == "男":
        params['sex'] = "1"
    else:
        params['sex'] = "0"
        
    params['act'] = "submit"
    params['isbz'] = "1"
	# 是否考虑真太阳时
    # params['zyt'] = "1"
    
    # for k, v in params.items():
    #    print k, v
    
    #post_data = parse.urlencode(params).encode('UTF-8')
    #print('quote=' +parse.quote('北京'));
    post_data = parse.urlencode(params, encoding='GB18030').encode()
    #post_data = b'data_type=0&year=2018&month=7&day=23&hour=9&minute=50&pid=%B1%B1%BE%A9&cid=%B1%B1%BE%A9&wxxy=0&xishen=%BD%F0&yongshen=%BD%F0&xing=%CD%F5&ming=%B9%FA%C8%D9&sex=1&act=submit&isbz=1'
    #print("post_data = %s" % post_data);
	
    headers = {
        #'Accept-Encoding': 'gzip, deflate',
        'User-Agent': r'MMozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
        'Host': r'life.httpcn.com',
        'Origin': r'http://life.httpcn.com',
        'Referer': r'http://life.httpcn.com/xingming.asp',
        'Connection': 'keep-alive'
    }
	
    r = request.Request(sys_config.REQUEST_URL,headers=headers, data=post_data, method='POST')	
    req = request.urlopen(r)	
    # req = urllib2.urlopen(sys_config.REQUEST_URL, post_data)
    # print("sys_config.REQUEST_URL = %s" % sys_config.REQUEST_URL)
    # req = request.urlopen(sys_config.REQUEST_URL, post_data)
    content = req.read()
    
    soup = BeautifulSoup(content, 'html.parser', from_encoding="GB18030")
    full_name = get_full_name(name_postfix)
	
    #print("soup %s" % soup);
    
    # print soup.find(string=re.compile(u"姓名五格评分"))
    # print("result_data = "+result_data)
    for node in soup.find_all("div", class_="chaxun_b"):
        node_cont = node.get_text()
        #print('node_cont' + node_cont)
        if u'姓名五格评分' in node_cont:
            name_wuge = node.find(string=re.compile(u"姓名五格评分"))
            #print('name_wuge' + name_wuge)
            result_data['wuge_score'] = name_wuge.next_sibling.b.get_text()
        
        if u'姓名八字评分' in node_cont:
            name_wuge = node.find(string=re.compile(u"姓名八字评分"))
            result_data['bazi_score'] = name_wuge.next_sibling.b.get_text()
    
	
    result_data['total_score'] = float(result_data['wuge_score']) + float(result_data['bazi_score'])
    result_data['full_name'] = full_name
    
    return result_data
    

def compute_and_writefile(name_postfix):
    try:
        global fout
        name_data = compute_name_score(name_postfix)
        write_to_file(fout, name_data)
    except Exception as e:
        print('error, ', e, name_postfix)

def get_full_name(name_postfix):
    return "%s%s" % ((user_config.setting["name_prefix"]), name_postfix)


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
    line = ""
    line += name_data['full_name'] + "\t" + str(name_data['bazi_score']) + "\t" + str(name_data['wuge_score']) + "\t" + str(name_data['total_score']) + "\n"
    line.encode('UTF-8')			   
    fout.write(line)
    fout.flush()
    lock.release()

def process(output_fpath):
    """计算并且将结果输出到文件
    """
    global fout
    # 输出文件路径
    fout = open(output_fpath, 'w', encoding='utf-8')
    # 获得所有可用的名字列表
    all_name_postfixs = get_name_postfixs()
    #all_name_postfixs = ['国荣']
    
    global all_count
    all_count = len(all_name_postfixs)
     
    pool = threadpool.ThreadPool(1)
    requests = threadpool.makeRequests(compute_and_writefile, all_name_postfixs) 
    [pool.putRequest(req) for req in requests]
    pool.wait()  

    fout.flush()
    fout.close()
    #csvfile.close();


if __name__ == "__main__":
    print("sys.getdefaultencoding() = " + sys.getdefaultencoding());
    print("begin................................")
    output_fpath = "./outputs/%s.txt" % user_config.setting["output_fname"]
    process(output_fpath)
    print("over................................")

