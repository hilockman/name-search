$(function() {

	$(document).keypress(function(e) {
		if(e.which === 13) {
			// enter has been pressed, execute a click on .js-new:
			$("form .btn-name-search").click();
		}
	});
    
	 $('.navbar ul.nav > li').each(function () {
		 var a = $(this).find("a:first")[0];
		 if ($(a).attr("href") === location.pathname) {
			 $(this).addClass("active");
		 } else {
			 $(this).removeClass("active");
		 }
	 });
	 
	 
	 var html = $('select[name="src-select"]').html();
	 
	for (var i = 0; i < 58; i++) {
		html += "<option value='json/poet/poet.tang."+i*1000+".json'>唐诗"+i+"</option>";
	}
	$('select[name="src-select"]').html(html)
	 
	var  normalOpt = {
		'num' : 1000,
		'filter' : normalSearch
	}
	 
    $('#btn-go').on('click', function() {
          refreshName(normalOpt)
    })
	
	if ($("#btn-go").length > 0) {
		refreshName(normalOpt)
	}

	var  limitOpt = {
		'num' : 1000,
		'filter' : limitSearch
	}
	
    $('#btn-limit-go').on('click', function() {
          refreshName(limitOpt)
    })
	
	if ($("#btn-limit-go").length > 0) {
		refreshName(limitOpt)
	}
	// refreshName(3);

});


function normalSearch(dataArr, num, objects, policy, limit) {
	console.log("normalSearch");
	var html = '';
    var cnt = 0;
	while (cnt < num) {
		var randPoem = genRandPoem(dataArr);
		var obj = genName(randPoem, policy, limit);
		var nameObjs = [];
		if (typeof obj === 'undefined')
			continue;
		else if ($.isArray(obj)) {
			nameObjs = obj;
		} else {
			nameObjs.push(obj);
		}
		
		nameObjs.forEach(function (nameObj) {
			if (!hasBanWord(nameObj.name)) {
				nameObj['index'] = cnt;
				html += name2html(nameObj);
				objects.push(nameObj);
				cnt++;
			}			
		});
	
	}
	
	return html;
}

function limitSearch(dataArr, num, objects, policy, limit) {
	var html = '';
    var cnt = 0;


	dataArr.forEach(function (randPoem) {
		if (!randPoem.content)
			return;
		
		var obj = genName(randPoem, policy, limit);
		var nameObjs = [];
		if (typeof obj === 'undefined')
			return;
		else if ($.isArray(obj)) {
			nameObjs = obj;
		} else {
			nameObjs.push(obj);
		}
		
		nameObjs.forEach(function (nameObj) {
			if (!hasBanWord(nameObj.name)) {
				nameObj['index'] = cnt;
				html += name2html(nameObj);
				objects.push(nameObj);
				cnt++;
			}			
		});

	});

	
	return html;
}


function refreshName(searchOpt) {
	var num = searchOpt.num;
	var filter = searchOpt.filter;
	
	var jsonFilename = 'static/'+$('select[name="src-select"]').val();
	selectedNameObjs = [];
	nameList = [];
	nameSet = new Set();
	var policy = $('select[name="select-strategy"]').val();
	var limit = $('input[name="limit-name"]').val();
	if (typeof limit !== 'undefined') 
	{
		if (limit.length == 0)
		  limit = undefined
	}
	showMessage("load...");
	$('tbody').html('');
	$.ajax({
		url: jsonFilename,
		dataType: 'json',
		success: function(dataArr) {
			if (jsonFilename.indexOf('json/shijing/') >= 0) {
				dataArr = dataArr.map(function(d) {
					d.author = "佚名";
					d.book = "诗经";
					d.dynasty = "春秋";
					var content = ""
					d.content.forEach(function(c){content += c;});
					d.content = content;
					return d;
					
				});
			} else if (jsonFilename.indexOf('json/poet/') >= 0) {
				dataArr = dataArr.map(function(d) {
					d.book = "唐诗";
					d.dynasty = "唐";
					var content = ""
					d.paragraphs.forEach(function(c){content += c;});
					d.content = content;
					return d;
					
				});
			}
			
			
			
			var html = filter(dataArr, num, nameList, policy, limit);
			if (html.length == 0) {
				showMessage("Find no record.");
			} else {
				showMessage();
			}
			$('tbody').html(html);
			
			$('.name').on('click', function(event) {
				var cell = $(this);
			  	var index = parseInt(cell.parent().attr("id"));							  
				addName(cell, nameList[index]);
			});

		},
		error : function(err) {
			showMessage(err);
 		}
		
	})
}

function showMessage(msg) {
	if (msg == undefined || msg.length == 0)
		$('#message-box').hide();
	else
		$('#message-box').show().html('<p style="text-align:center">'+msg+'<p>');
}

function addName(cell, nameObj) {
	$.ajax({
				url : "/name",
				type : "POST",
				data : JSON.stringify(nameObj),
				contentType: "application/json; charset=utf-8",
				success : function(msg) {
				  cell.parent().addClass('active').siblings().removeClass('active');
				  var btn = $("#name-selected-btn span");
				  
				  var name = cell.html();
				  if (nameSet.has(name))
					  return;
				  
				  nameSet.add(name);
				  btn.html(nameSet.size);

				  var allNameSize = parseInt($("#all-selected-btn span").html())
				  $("#all-selected-btn span").html(allNameSize+1);
						
				},
				error : function(err) {
					console.log("fail to add name : err= "+ err);
				}
	 });
			
}

function name2html(nameObj) {
	var familyName = $('input[type=text]').val();
	nameObj['familyName'] = familyName;
	var template = "<tr class='name-box clickable-row' id={{index}}><td>{{index}}</td><td class='name'>{{familyName}}{{name}}</td><td>{{sentence}}</td><td>{{book}}•{{title}}</td><td>[{{dynasty}}]{{author}}</td></tr>";
	return getHtmlFromTemplate(template, nameObj);
}

function getHtmlFromTemplate(template, dataJson) {
	var html = template;
	for (var key in dataJson) {
		var reg = new RegExp('{{' + key + '}}', 'g');
		html = html.replace(reg, dataJson[key]);
	}
	return html;
}

function genRandPoem(dataArr) {
	var index = randBetween(0, dataArr.length);
	while (!dataArr[index].content) {
		index = randBetween(0, dataArr.length);
	}
	return dataArr[index];
}

function randBetween(min, max) {
	//[min,max)  max is not included
	return min + Math.floor(Math.random() * (max - min));
}

function splitSentence(str) {
	str = cleanStr(str);
	str = str.replace(/！|。|？|；/g, function(str) {
		return str + '|';
	})
	str = str.replace(/\|$/g, '');
	var arr = str.split('|');
	arr = arr.filter(function(item) {
		return item.length >= 2;
	})
	return arr;
}

function splitSentence1(str) {
	str = cleanStr(str);
	str = str.replace(/！|。|？|；|，/g, function(str) {
		return str + '|';
	})
	str = str.replace(/\|$/g, '');
	var arr = str.split('|');
	arr = arr.filter(function(item) {
		return item.length >= 2;
	})
	return arr;
}

function cleanStr(str) {
	str = str.replace(/\s|<br>|<p>|<\/p>|　|”|“/g, '');
	str = str.replace(/\(.+\)/g, '');
	return str
}


function randCharFromStr(randPoem, num, ordered) {
	console.log("randCharFromStr...");
			
	var sentences = splitSentence(randPoem.content);
	var randSentence = sentences[randBetween(0, sentences.length)];
	
	var str = cleanPunctuation(randSentence);
	if (str.length < num)
		return
	
	if (typeof ordered === 'undefined') {
		ordered = true;
	}
	var randNumArr = genRandNumArr(str.length, num);
	if (ordered) {
		randNumArr = randNumArr.sort(function(a, b) {
			return a - b;
		});
	}
	var res = '';
	var name = {}
	for (var i = 0; i < randNumArr.length; i++) {
		res += str.charAt(randNumArr[i]);
	}
	name.name = res;
	name.sentence = randSentence;
	return name;
}

function randCharFromStr1(randPoem, num, ordered) {
	var sentences = splitSentence(randPoem.content);
	var randSentence = sentences[randBetween(0, sentences.length)];

	var str = cleanPunctuation(randSentence);
	if (str.length < num)
		return
	
	if (typeof ordered === 'undefined') {
		ordered = true;
	}
	var randNum = randBetween(0, str.length);
	while (randNum > str.length - num) {
		randNum = randBetween(0, str.length);
	}
	
	randNumArr = [];
	for (var i = 0; i < num; i++) {
	   randNumArr.push(randNum + i);
	}

	var res = '';
	var name = {};
	for (var i = 0; i < randNumArr.length; i++) {
		res += str.charAt(randNumArr[i]);
	}
	name.name = res;
	name.sentence = randSentence;
	return name;
}


function limitCharFromStr(randPoem, num, limit, position) {   
   	var sents = splitSentence(randPoem.content);
	var names = [];
	sents.forEach(function (sourceSentence) {		
		if (typeof limit !== 'undefined' && sourceSentence.indexOf(limit) < 0)
            return;			
			
		var sentences = splitSentence1(sourceSentence);
		var sentence;
		sentences.forEach(function(sentence)  {
			var res = '';
			var name = {};
			var pos;
			var randNumArr;
			
			var str = cleanPunctuation(sentence);
			if (str.length < num)
			   return;
		   
			if (typeof limit === 'undefined') {
				if (position === 'Head') {
					pos = 0;		
					randNumArr = [pos, pos + 1];	
				} else if (position === 'Tail') {
					pos = str.length - 1;
					randNumArr = [pos - 1, pos];
                } else {
				    randNumArr = genRandNumArr(str.length, num);			
					randNumArr = randNumArr.sort(function(a, b) {
							return a - b;
					});
				}					
			} else {
				pos = str.indexOf(limit);
				if (pos < 0) return;	

				if (typeof position === 'undefined') {					
					position = ['Head', 'Tail'][randBetween(0, 2)];
				}
				
				if (position === 'Head') {
                    if (pos + 1 >= str.length) return;					
					randNumArr = [pos, pos + 1];	
				} else if (position === 'Tail') {
					if (pos <= 0) return;
					randNumArr = [pos - 1, pos];
                }			
			}
						
			for (var i = 0; i < randNumArr.length; i++) {
				res += str.charAt(randNumArr[i]);
			}
			name.name = res;
			name.sentence = sourceSentence;
			names.push(name);	
		});
			

	});

	return names;
}

function limitHeadCharFromStr(randPoem, num, limit) {
    return limitCharFromStr(randPoem, num, limit, 'Head');
}


function limitTailCharFromStr(randPoem, num, limit) {   
   	return limitCharFromStr(randPoem, num, limit, 'Tail');
}

function limitRandCharFromStr(randPoem, num, limit) {
    return limitCharFromStr(randPoem, num, limit);
}

function tailCharFromStr1(randPoem, num, ordered) {
   	var sents = splitSentence(randPoem.content);
	var names = [];
	sents.forEach(function (sourceSentence) {	
		var sentences = splitSentence1(sourceSentence);
		sentences.forEach(function (sentence) {
			var str = cleanPunctuation(sentence);
			if (str.length < 2)
				return
			
			var randNumArr = [str.length - 2, str.length - 1];

			var res = '';
			var name = {};
			for (var i = 0; i < randNumArr.length; i++) {
				res += str.charAt(randNumArr[i]);
			}
			name.name = res;
			name.sentence = sourceSentence;		
			names.push(name);
		});	
	});	


	return names;
}

function tailCharFromStr(randPoem, num, ordered) {
	var sentences = splitSentence(randPoem.content);
	if (sentences.length == 0)
		return;
	
	var randSentence = sentences[randBetween(0, sentences.length)];	
	var sentences1 = splitSentence1(randSentence);
	var randSentence1 = sentences1[randBetween(0, sentences1.length)];
	var str = cleanPunctuation(randSentence1);
	if (str.length < 2)
		return
	
	var randNumArr = [str.length - 2, str.length - 1];

	var res = '';
	var name = {};
	for (var i = 0; i < randNumArr.length; i++) {
		res += str.charAt(randNumArr[i]);
	}
	name.name = res;
	name.sentence = randSentence;	
	return name;
}
function headCharFromStr(randPoem, num, ordered) {
	var sentences = splitSentence(randPoem.content);
	var randSentence = sentences[randBetween(0, sentences.length)];		
	var sentences1 = splitSentence1(randSentence);
	var randSentence1 = sentences1[randBetween(0, sentences1.length)];
	var str = cleanPunctuation(randSentence1);
	if (str.length < 2)
		return
	
	var randNumArr = [0, 1];

	var res = '';
	var name = {};
	for (var i = 0; i < randNumArr.length; i++) {
		res += str.charAt(randNumArr[i]);
	}
	name.name = res;
	name.sentence = randSentence;	
	return name;
}	

function genRandNumArr(max, num) {
	if (num > max) {
		num = max;
		console.log('max=' + max + ' num = ' + num);
		// throw new Error('too large num');
	}
	var orderedNum = [];
	for (var i = 0; i < max; i++) {
		orderedNum.push(i);
	}
	var res = [];
	for (var i = 0; i < num; i++) {
		var randIndex = randBetween(0, orderedNum.length);
		var randNum = orderedNum[randIndex];
		res.push(randNum);
		orderedNum.splice(randIndex, 1);
		// console.log('i=' + i + 'rand=' + rand, orderedNum);
	}
	return res;
}

var selectPolicies = {
'0' : tailCharFromStr,
'1' : headCharFromStr,
'2' : randCharFromStr,
'3' : limitTailCharFromStr,
'4' : limitHeadCharFromStr,
'5' : limitRandCharFromStr,
'6' : randCharFromStr1,
'7' : tailCharFromStr1,
}

var default_proc = {
	'poemArrayPoc': function(poemArray) {
		               return genRandPoem(poemArray);
	                },
    'poemProc':     function (poem) {
	                   return splitSentence(poem.content);
                    }
}

var select_policies = {
  'tail' : { 
              'name' : 'tail',
			  'desc' : '末尾',
           },
}


/*
function genLimitName(randPoem, policy, limit) {
	if (typeof policy === 'undefined')
		policy = '0';
	
	var sentences = splitSentence(randPoem.content);
	//var randSentence = sentences[randBetween(0, sentences.length)];
	var names = [];
	sentences.forEach(function(sentence) {
		var name = {};
		name.title = randPoem.title;
		name.book = randPoem.book;
		name.sentence = sentence;
		name.content = randPoem.content;
		name.author = randPoem.author ? randPoem.author : '佚名';
		name.dynasty = randPoem.dynasty;

		name.name = selectPolicies[policy](sentence, 2, limit);
		if (typeof name.name === 'undefined')
			return
		names.push(name);
	});
	
	return names;

}
*/
function initName(name, randPoem) {
	name.title = randPoem.title;
	name.book = randPoem.book;
	name.content = randPoem.content;
	name.author = randPoem.author ? randPoem.author : '佚名';
	name.dynasty = randPoem.dynasty;
}
function genName(randPoem, policy, limit) {
	if (typeof policy === 'undefined')
		policy = '0';
		
	var res = selectPolicies[policy](randPoem, 2, limit);
	if (res == undefined)
		return;
	
	
	if ($.isArray(res)) {
		var names = [];
		res.forEach(function(name) {
			if (typeof name.name === 'undefined')
			  return;	
		  
		    initName(name, randPoem);
		    names.push(name);
		});
		
		return names.length == 0? undefined : names;
	} else {
		var name = res;
		if (typeof name.name === 'undefined')
			return	
			
		initName(name, randPoem);
		return res;
	}
	
	
}
//清除标点符号
function cleanPunctuation(str) {
	var puncReg = /[<>《》！*\(\^\)\$%~!@#…&%￥—\+=、。，？；‘’“”：·`]/g;
	return str.replace(puncReg, '');
}

function hasBanWord(str) {
	var banStr = '鸟鸡我邪罪凶丑仇鼠蟋蟀淫秽妹狐鸡鸭蝇悔鱼肉苦犬吠窥血丧饥女搔父母昏狗蟊疾病痛死潦哀痒害蛇牲妇狸鹅穴畜烂兽靡爪氓劫鬣螽毛婚姻匪婆羞辱';
	var banArr = banStr.split('');
	// console.log(banArr);
	for (var i = 0; i < banArr.length; i++) {
		if (str.indexOf(banArr[i]) !== -1) {
			// console.log(str, banArr[i]);
			return true;
		}
	}
	return false;
}
	
