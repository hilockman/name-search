#!flask/bin/python
from flask import Flask
from flask import render_template
from flask import request
import csv
import codecs
import user_config
from pathlib import Path

import simplejson as json
import threading
import threadpool
import io
import os

from jinja2 import Template
from jinja2 import Environment, select_autoescape

env = Environment(autoescape=select_autoescape(
    enabled_extensions=('html', 'xml'),
    default_for_string=True,
))

fout = None
outfile = None
quit = False

app = Flask(__name__)

nameLock = threading.Lock()
all_names = [];

@app.route('/hello')
def hello():
    return "Hello, World!"
	
@app.route('/')
@app.route('/index')
@app.route('/home')
def home():
    return render_template('index.html', name_count=len(all_names))
	
@app.route('/limit')
def limit():
    return render_template('limit.html', name_count=len(all_names))
	
@app.route('/allnames')
def allNames():
    return render_template('allnames.html', name_count=len(all_names), name_list=all_names)	
		
@app.route('/name',methods=['POST'])
def addName() :
    content = request.json
    print(content)
    print('titile:'+content['title'])
    saveName(content)
    return 'test'

	
def saveName(nameObj) :
    #nameObj = json.loads(nameString)
    global fout
    #fout.writerow(['name', 'title', 'book', 'sentence', 'author','dynasty'])	  
    fout.writerow([str(nameObj['familyName'])+str(nameObj['name']), str(nameObj['title']), str(nameObj['sentence']), str(nameObj['author']), str(nameObj['dynasty'])])
    global outfile
    outfile.flush()	
    global all_names
    all_names.extend(nameObj)
	
def loadNames(fpath) :	  
    with open(fpath, 'r', newline='', encoding='utf-8-sig') as csvfile:
      reader = csv.DictReader(csvfile, dialect='excel')

      global all_names
      title = reader.fieldnames
      nameLock.acquire(); 
      for row in reader:
        all_names.extend([{title[i]:row[title[i]] for i in range(len(title))}])
      index = 0;
      for name in all_names:
        name['index'] = index
        index += 1	
      print("load names : size = %d" % len(all_names))
      nameLock.release();  

if __name__ == '__main__':
    output_fpath = "./outputs/%s.csv" % user_config.setting["selected_names_fname"]
	
    my_file = Path(output_fpath)
    if my_file.is_file() != True:
      # 输出文件路径
      outfile = open(output_fpath, 'a+', newline='', encoding='utf-8-sig')
      fout = csv.writer(outfile, dialect='excel')	
      fout.writerow(['name', 'title', 'book', 'sentence', 'author','dynasty'])	
      outfile.flush()	
      print("create new file :"+	output_fpath);  
    else :
      outfile = open(output_fpath, 'a+', newline='', encoding='utf-8-sig')
      fout = csv.writer(outfile, dialect='excel')
      loadNames(output_fpath);	  
	
	
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)