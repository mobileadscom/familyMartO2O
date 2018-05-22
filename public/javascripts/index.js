import miniPages from './miniPages';
import {singleAnswerQuestion, multipleAnswerQuestion, dropdownQuestion} from './questions';
import miniSelect from './miniSelect';
import modal from './modal';
import {winningLogic, coupon} from './winningLogic';
import user from './user';
import '../stylesheets/miniSelect.css';
import '../stylesheets/style.css';
import '../stylesheets/miniCheckbox.css';
import '../stylesheets/modal.css';
import '../stylesheets/regForm.css';

var app = {
	pages: null,
	params: {},
	q: [],
	getParams: function() {
		  var query_string = {};
		  var query = window.location.search.substring(1);
		  var vars = query.split("&");
		  for (var i=0;i<vars.length;i++) {
		      var pair = vars[i].split("=");
		      // If first entry with this name
		      if (typeof query_string[pair[0]] === "undefined") {
		          query_string[pair[0]] = pair[1];
		      // If second entry with this name
		      } else if (typeof query_string[pair[0]] === "string") {
		          var arr = [ query_string[pair[0]], pair[1] ];
		          query_string[pair[0]] = arr;
		      // If third or later entry with this name
		      } else {
		          query_string[pair[0]].push(pair[1]);
		      }
		  } 
		  return query_string;
	},
	initResult(state, couponLink) {
		if (state == 'win') {
			document.getElementById('resultTitle').innerHTML = "おめでとうございます！";
			document.getElementById('resultDescription').innerHTML = "カルビー じゃがりこ サラダが当たりました。";
			if (user.isWanderer) {
				document.getElementById('couponLink').style.display = 'none';
				document.getElementById('resultInstruction').style.display = 'none;'
			}
			else {
				document.getElementById('resultInstruction').innerHTML = "クーポンを受け取って、セブン-イレブンで引き換えてください";
			}

			if (couponLink) {
				document.getElementById('couponLoader').style.display = 'none';
				document.getElementById('couponLink').href = couponLink;
				document.getElementById('couponLink').setAttribute('target', '_blank');
			  document.getElementById('getCoupon').innerText = 'クーポンを受け取る';
			}
		}
		else {
			document.getElementById('resultTitle').innerHTML = "残念！<br>ハズレです";
			document.getElementById('resultImage').style.display = 'none';
			document.getElementById('couponLink').style.display = 'none';
		}
	},
	continue: function() {
		var localAnswers = JSON.parse(localStorage.getItem('localAnswers'));
		var userAnswers = [];
		var noQuestionAnswered = 0;
		if (localAnswers) {
			if (localAnswers.hasOwnProperty(user.info.id)) {
				userAnswers = localAnswers[user.info.id];
				noQuestionAnswered = userAnswers.length - 1;
			}
		}
		
		if (!userAnswers) {
			userAnswers = JSON.parse(user.info.Answers);
			noQuestionAnswered = user.info.noQuestionAnswered;
		}

		for (var w = 1; w < this.q.length; w++) {
			if (userAnswers[w]) {
			  this.q[w].setAnswer(userAnswers[w]);
			}
		}
		
		if (user.info.state == 'win') {
			this.initResult('win', user.info.couponLink);
			this.pages.toPage('resultPage');
		}
		else if (user.info.state == 'lose') {
			this.initResult('lose');
			this.pages.toPage('resultPage');
		}
		else {
			if (noQuestionAnswered > 0) {
				this.pages.toPage('page' + (noQuestionAnswered + 2).toString());
			}
			else {
				this.pages.toPage('introPage');
			}
		}
	},
	events: function() {
		/* ==== Event Listeners ==== */
	  /* enabled terms agree checkbox when scrolled tnc to bottom */
	  var enableAgreeCheckbox = false;
	  document.getElementById('tnc').addEventListener('scroll', function(event) {
	  	if (!enableAgreeCheckbox) {
	  		var element = event.target;
		    if (element.scrollHeight - element.scrollTop < element.clientHeight + 50) {
		    	document.getElementById('startSurvey').disabled = false;
		      /*document.getElementById('agreeCheck').disabled = false;
		      enableAgreeCheckbox = true;*/
		    }
	  	}
	  });
	  
	  /* enable start survey button when terms agree checkbox is checked */
	  /*document.getElementById('agreeCheck').onchange = function() {
	    if (this.checked) {
				document.getElementById('startSurvey').disabled = false;
	    }
	    else {
	    	document.getElementById('startSurvey').disabled = true;
	    }
	  }*/
	  
	  /* Finished Answering Questions, process result */
	  var processed = false;
	  document.getElementById('toResult').addEventListener('click', () => {
	  	if (!processed) {
	  		processed = true;
	  		var resultProperties = winningLogic.process(this.q, !user.isWanderer);
	  		console.log(resultProperties);
	  		var state = resultProperties.trackingResult;
	  		var actualResult = resultProperties.actualResult;
	  		var group = resultProperties.group;
	  		var flag = resultProperties.flag;
	
	  		if (!user.isWanderer) {
	  			if (actualResult == 'win') {
		  			user.win(user.info.id, group, user.source).then((response) => {
							console.log(response);
							if (response.data.couponLink) {
								this.initResult('win', response.data.couponLink);
								user.passResult(user.info.id, flag, user.source, response.data.couponLink);
							}
							else {
								this.initResult('lose');
								user.passResult(user.info.id, flag, user.source);
							}
		  			}).catch((error) => {
		  				console.log(error);
			  			this.initResult('win');
		  			});
		  		}
		  		else {
		  			user.lose(user.info.id, user.source).then((response) => {
		  				console.log(response);
		  				user.passResult(user.info.id, flag, user.source);
		  			}).catch((error) => {
		  				console.log(error);
		  			});
		  			this.initResult('lose');
		  		}

		  		if (state == 'win') {
		  			//track win
		  			user.trackWin(user.info.id);
		  		}
		  		else {
		  			user.trackLose(user.info.id);
		  			// track lose
		  		}
	  		}
	  		else {
	  			this.initResult(state);
	  		}	
	  	}
	  });

	  var form = document.getElementById('regForm');
	  form.onsubmit = (event) => {
	    var spinner = document.getElementById('formWorking');
	    var donePage = document.getElementById('doneSec');
	    var regPage = document.getElementById('regSec');
		  form.style.display = 'none';
	    spinner.style.display = 'block';
      event.preventDefault();
      var email = document.getElementById('emailInput').value;
			user.registerEmail(form, email).then((response) => {
				console.log(response);
        spinner.style.display = 'none';
        if (response.data.status == true) {
        	this.formSections.toPage('doneSec');
        }
        else if (response.data.message == 'user exist.') {
        	user.info = response.data.user;
        	this.continue();
					modal.closeAll();
        }

			}).catch((error) => {
				console.log(error);
        spinner.style.display = 'none';
			});
    }
	  /* ==== Event Listeners End ==== */
	},
	setQuestions() {
		/* ==== Set Questions ==== */
	/*  this.q[1] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q1'),
	    question: '<span class="red">QUESTION 1</span><br>応募にあたり、応募規約に同意します',
	    answers: [{
	    	value: 'はい',
	    	text: 'はい',
	    }, {
	    	value: 'いいえ',
	    	text: 'いいえ'
	    }],
	    nextBtn: document.getElementById('toQ2')
	  });*/

	  this.q[1] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q2'),
	  	question: '<span class="red">QUESTION 1</span><br>あなたの性別を教えてください',
	  	answers: [{
	    	value: '男',
	    	text: '男',
	    }, {
	    	value: '女',
	    	text: '女'
	    }],
	    nextBtn: document.getElementById('toQ3')
	  });
	  
	  this.q[2] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q3'),
	  	question: '<span class="red">QUESTION 2</span><br>あなたの年代を教えてください',
	  	answers: [{
	    	value: '19歳未満',
	    	text: '19歳未満',
	    }, {
	    	value: '20歳〜24歳',
	    	text: '20歳〜24歳'
	    }, {
	    	value: '25歳〜29歳',
	    	text: '25歳〜29歳'
	    }, {
	    	value: '30歳〜34歳',
	    	text: '30歳〜34歳'
	    }, {
	    	value: '35歳〜39歳',
	    	text: '35歳〜39歳'
	    }, {
	    	value: '40歳〜44歳',
	    	text: '40歳〜44歳'
	    }, {
	    	value: '45歳〜49歳',
	    	text: '45歳〜49歳'
	    }, {
	    	value: '50歳〜54歳',
	    	text: '55歳〜59歳'
	    }, {
	    	value: '60歳以上',
	    	text: '60歳以上'
	    }],
	    nextBtn: document.getElementById('toQ4')
	  });

	  this.q[3] = new dropdownQuestion({
	  	wrapper: document.getElementById('q4'),
	  	question: '<span class="red">QUESTION 3</span><br>あなたのお住まいの都道府県を教えてください',
	  	answers: [
				{ value:'北海道', text:'北海道'},
				{ value:'青森県', text:'青森県'},
				{ value:'岩手県', text:'岩手県'},
				{ value:'宮城県', text:'宮城県'},
				{ value:'秋田県', text:'秋田県'},
				{ value:'山形県', text:'山形県'},
				{ value:'福島県', text:'福島県'},
				{ value:'茨城県', text:'茨城県'},
				{ value:'栃木県', text:'栃木県'},
				{ value:'群馬県', text:'群馬県'},
				{ value:'埼玉県', text:'埼玉県'},
				{ value:'千葉県', text:'千葉県'},
				{ value:'東京都', text:'東京都'},
				{ value:'神奈川県', text:'神奈川県'},
				{ value:'新潟県', text:'新潟県'},
				{ value:'富山県', text:'富山県'},
				{ value:'石川県', text:'石川県'},
				{ value:'福井県', text:'福井県'},
				{ value:'山梨県', text:'山梨県'},
				{ value:'長野県', text:'長野県'},
				{ value:'岐阜県', text:'岐阜県'},
				{ value:'静岡県', text:'静岡県'},
				{ value:'愛知県', text:'愛知県'},
				{ value:'三重県', text:'三重県'},
				{ value:'滋賀県', text:'滋賀県'},
				{ value:'京都府', text:'京都府'},
				{ value:'大阪府', text:'大阪府'},
				{ value:'兵庫県', text:'兵庫県'},
				{ value:'奈良県', text:'奈良県'},
				{ value:'和歌山県', text:'和歌山県'},
				{ value:'鳥取県', text:'鳥取県'},
				{ value:'島根県', text:'島根県'},
				{ value:'岡山県', text:'岡山県'},
				{ value:'広島県', text:'広島県'},
				{ value:'山口県', text:'山口県'},
				{ value:'徳島県', text:'徳島県'},
				{ value:'香川県', text:'香川県'},
				{ value:'愛媛県', text:'愛媛県'},
				{ value:'高知県', text:'高知県'},
				{ value:'福岡県', text:'福岡県'},
				{ value:'佐賀県', text:'佐賀県'},
				{ value:'長崎県', text:'長崎県'},
				{ value:'熊本県', text:'熊本県'},
				{ value:'大分県', text:'大分県'},
				{ value:'宮崎県', text:'宮崎県'},
				{ value:'鹿児島県', text:'鹿児島県'},
				{ value:'沖縄県', text:'沖縄県'}
	  	],
	  	nextBtn: document.getElementById('toQ5')
	  });

	  this.q[4] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q5'),
	  	question: '<span class="red">QUESTION 4</span><br>インターネットで応募して、景品（飲料やお菓子など店頭で販売されている商品）をコンビニで受け取るキャンペーンに応募したことがある',
	  	answers: [{
	    	value: '応募したことがあり、当選して景品を受け取ったことがある',
	    	text: '応募したことがあり、当選して景品を受け取ったことがある',
	    }, {
	    	value: '応募したことはあるが、景品を受け取ったことはない',
	    	text: '応募したことはあるが、景品を受け取ったことはない'
	    }, {
	    	value: '応募したことがない',
	    	text: '応募したことがない'
	    }],
	    nextBtn: document.getElementById('toQ6')
	  });

	  this.q[5] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q6'),
	  	question: '<span class="red">QUESTION 5</span><br>コンビニに行く頻度を教えてください',
	  	answers: [{
	    	value: 'ほぼ毎日',
	    	text: 'ほぼ毎日',
	    }, {
	    	value: '週４〜５回',
	    	text: '週４〜５回'
	    }, {
	    	value: '週２〜３回',
	    	text: '週２〜３回'
	    }, {
	    	value: '週１〜２回',
	    	text: '週１〜２回'
	    }, {
	    	value: '隔週程度',
	    	text: '隔週程度'
	    }, {
	    	value: '月１回未満',
	    	text: '月１回未満'
	    }],
	    nextBtn: document.getElementById('toQ7')
	  });

	  this.q[6] = new multipleAnswerQuestion({
	  	wrapper: document.getElementById('q7'),
	  	question: '<span class="red">QUESTION 6</span><br>過去３ヶ月以内で来店したコンビニを教えてください（複数選択可）',
	  	answers: [{
	    	value: 'セブン-イレブン',
	    	text: 'セブン-イレブン',
	    }, {
	    	value: 'ファミリーマート',
	    	text: 'ファミリーマート'
	    }, {
	    	value: 'ローソン',
	    	text: 'ローソン'
	    }, {
	    	value: 'ミニストップ',
	    	text: 'ミニストップ'
	    }, {
	    	value: 'サークルK・サンクス',
	    	text: 'サークルK・サンクス'
	    }, {
	    	text: 'その他',
	      type: 'text'
	    }],
	    nextBtn: document.getElementById('toQ8')
	  });

	  this.q[7] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q8'),
	  	question: '<span class="red">QUESTION 7</span><br>あなたが一番よく使うコンビニを教えてください',
	  	answers: [{
	    	value: 'セブン-イレブン',
	    	text: 'セブン-イレブン',
	    }, {
	    	value: 'ファミリーマート',
	    	text: 'ファミリーマート'
	    }, {
	    	value: 'ローソン',
	    	text: 'ローソン'
	    }, {
	    	value: 'ミニストップ',
	    	text: 'ミニストップ'
	    }, {
	    	value: 'サークルK・サンクス',
	    	text: 'サークルK・サンクス'
	    }, {
	    	text: 'その他',
	      type: 'text'
	    }],
	    nextBtn: document.getElementById('toResult')
	  });
	  /* ==== Questions End ==== */
	},
	init: function() {
		/* init pagination */
		this.params = this.getParams();
		this.pages = new miniPages({
	  	pageWrapperClass: document.getElementById('page-wrapper'),
	  	pageClass: 'page',
	  	initialPage: document.getElementById('loadingPage'),
	  	pageButtonClass: 'pageBtn'
	  });

	  /* init registration form sections */
	  this.formSections = new miniPages({
	  	pageWrapperClass: document.getElementById('formSecWrapper'),
	  	pageClass: 'sec',
	  	initialPage: document.getElementById('regSec')
	  });
    
    this.setQuestions();
    this.events();
    /* apply mini select to <select> */
	  miniSelect.init('miniSelect');

	  /* User Info */
	  if (!this.params.userId ) {
		  user.isWanderer = true;
	    setTimeout(() => {
		    this.pages.toPage('regPage');
		  }, 1000);
	  }
	  else {
			
			/* check if user is registered, if no, then register user, if yes, continue on where the user left off */
			user.get(this.params.userId).then((response) => {
				console.log(response);
	    	if (response.data.status == false) { // user is not registered
		    	this.pages.toPage('regPage');
	    	/*	user.register(this.params.userId).then((res) => { // auto register user
						console.log(res);
						user.info.id = this.params.userId;
						user.source = this.params.source;
					  this.pages.toPage('introPage');
	    		}).catch((err) => {
	    			user.isWanderer = true;
	    			console.log(err);
	    			this.pages.toPage('introPage');
	    		});*/
	    	}
	    	else { // user is registered
	    		user.isWanderer = false;
					user.info = response.data.user;
					// user.source = this.params.source;
					/*apply answer to answered question */

					this.continue();

	    	}
	    }).catch((error) => {
	    	user.isWanderer = true;
				console.log(error);
				this.pages.toPage('introPage');
	    });

	    /* Auto save answer for every questions*/
		  var saveBtns = document.getElementsByClassName('saveQuestion');
		  for (var s = 0; s < saveBtns.length; s++ ) {
		  	saveBtns[s].addEventListener('click', (e) => {
		  		if (typeof(Storage) !== "undefined") {
		  			var localAnswers = JSON.parse(localStorage.getItem('localAnswers'));
		  			if (!localAnswers) {
		  				localAnswers = {};
			  		}
				  	var qArray = [];
				  	for (var n = 1; n < this.q.length; n++) {
							if (this.q[n].selectedAnswer) {
								qArray[n] = this.q[n].selectedAnswer;
							}
				  	}
				  	localAnswers[user.info.id] = qArray;
				  	localStorage.setItem('localAnswers', JSON.stringify(localAnswers));
		  		}
		  		var qNo = parseInt(e.target.dataset.question);
		  		user.trackAnswer(this.params.userId, qNo, this.q[qNo].selectedAnswer);
				  /*user.saveAnswer(this.params.userId, qNo, this.q[qNo].selectedAnswer).then((response) => {
				  	console.log(response);
				  }).catch((error) => {
				  	console.log(error);
				  });*/
		  	})
		  }

	    /* get coupons */
			coupon.get(/*this.params.source*/);
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
  app.init();
  modal.init();
  window.q = app.q;
  window.params = app.params;
});

export {
	user,
	coupon,
}