#!flask/bin/python
from flask import Flask
from flask import render_template
from flask import request
import csv
import codecs
import user_config
from pathlib import Path

import simplejson as json

fout = None
outfile = None

app = Flask(__name__)

@app.route('/hello')
def hello():
    return "Hello, World!"
	
@app.route('/')
@app.route('/index')
@app.route('/home')
def home():
    return render_template('index.html')
	
@app.route('/limit')
def limit():
    return render_template('limit.html')
		
@app.route('/name',methods=['POST'])
def addName() :
    content = request.json
    print(content)
    print('titile:'+content['title'])
    saveName(content)
    return 'test'
    #nameObj = request.form['nameObj']
    #print("receive name :"+nameObj)


def saveName(nameObj) :
    #nameObj = json.loads(nameString)
    global fout
    #fout.writerow(['name', 'title', 'book', 'sentence', 'author','dynasty'])	  
    fout.writerow([str(nameObj['familyName'])+str(nameObj['name']), str(nameObj['title']), str(nameObj['sentence']), str(nameObj['author']), str(nameObj['dynasty'])])
    global outfile
    outfile.flush()	

if __name__ == '__main__':
    output_fpath = "./outputs/%s.csv" % user_config.setting["selected_names_fname"]
	
    my_file = Path(output_fpath)
    if my_file.is_file() != True:
      # file doesn't exist
      with open(output_fpath, 'wb') as outfile:
        outfile.write(codecs.BOM_UTF8)

      # 输出文件路径
      outfile = open(output_fpath, 'a+', newline='', encoding='UTF-8')
      fout = csv.writer(outfile, dialect='excel')	
      fout.writerow(['name', 'title', 'book', 'sentence', 'author','dynasty'])	
      outfile.flush()	
      print("create new file :"+	output_fpath);  
    else :
      outfile = open(output_fpath, 'a+', newline='', encoding='UTF-8')
      fout = csv.writer(outfile, dialect='excel')	
	  
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=5000)