import miniPages from './miniPages';
import {singleAnswerQuestion, multipleAnswerQuestion, dropdownQuestion} from './questions';
import miniSelect from './miniSelect';
import modal from './modal';
import {winningLogic, coupon} from './winningLogic';
import user from './userDemo';
import '../stylesheets/miniSelect.css';
import '../stylesheets/style.css';
import '../stylesheets/miniCheckbox.css';
import '../stylesheets/modal.css';
import '../stylesheets/regForm.css';

var app = {
	pages: null, // array of pages
	params: {}, // params in query string
	q: [], // array of questions
	player: null, //youtube player
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
	processResult() {
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
						var message = '綾鷹クーポンが当たりました！ ' + response.data.couponLink;
						user.messageTwitter(message);

						if (user.info.id.indexOf('@') > -1) { // login via email
		        	var emailContent = '<head><meta charset="utf-8"></head><div style="text-align:center;font-weight:600;color:#FF4244;font-size:28px;">おめでとうございます</div><br><br><div style="text-align:center;font-weight:600;">綾鷹クーポンが当たりました！</div><a href="' + response.data.couponLink + '" target="_blank" style="text-decoration:none;"><button style="display:block;margin:20px auto;margin-bottom:40px;border-radius:5px;background-color:#E54C3C;border:none;color:white;width:200px;height:50px;font-weight:600;">クーポンを受取る</button></a>';
	        	  user.sendEmail(user.info.id, 'FamilyMart Coupon Link', emailContent);
						}
						// user.passResult(user.info.id, flag, user.source, response.data.couponLink);
					}
					else {
						this.initResult('lose');
						// user.passResult(user.info.id, flag, user.source);
					}
  			}).catch((error) => {
  				console.log(error);
	  			this.initResult('win');
  			});
  		}
  		else {
  			user.lose(user.info.id, user.source).then((response) => {
  				console.log(response);
  				// user.passResult(user.info.id, flag, user.source);
  			}).catch((error) => {
  				console.log(error);
  			});
  			this.initResult('lose');
  		}

  		if (state == 'win') {
  			//track win
  			// user.trackWin(user.info.id);
  		}
  		else {
  			// user.trackLose(user.info.id);
  			// track lose
  		}
		}
		else {
			this.initResult(state);
		}	
	},
	continue: function() {
		var answerJson = '{}';
		if (localStorage.getItem('localAnswers')) {
			answerJson = localStorage.getItem('localAnswers');
		}
		var localAnswers = JSON.parse(answerJson);
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

		/*apply answer to answered question */
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
				if (noQuestionAnswered < this.q.length - 1) {
					this.pages.toPage('page' + (noQuestionAnswered + 1).toString());
				}
				else {
					this.pages.toPage('page' + (this.q.length - 1).toString());
				}
			}
			else {
				this.pages.toPage('termsPage');
			}
		}
	},
	events: function() {
		/* ==== Event Listeners ==== */
	  /* enabled terms agree checkbox when scrolled tnc to bottom */
	 /* var enableAgreeCheckbox = false;
	  document.getElementById('tnc').addEventListener('scroll', function(event) {
	  	if (!enableAgreeCheckbox) {
	  		var element = event.target;
		    if (element.scrollHeight - element.scrollTop < element.clientHeight + 50) {
		    	document.getElementById('startSurvey').disabled = false;*/
		      /*document.getElementById('agreeCheck').disabled = false;
		      enableAgreeCheckbox = true;*/
		 //    }
	  // 	}
	  // });
	  
	  /* enable start survey button when terms agree checkbox is checked */
	  document.getElementById('agreeCheck').onchange = function() {
	    if (this.checked) {
				document.getElementById('startSurvey').disabled = false;
	    }
	    else {
	    	document.getElementById('startSurvey').disabled = true;
	    }
	  }
	  
	  /* Finished Answering Questions, process result */
	  /*var processed = false;
	  document.getElementById('toResult').addEventListener('click', () => {
	  	if (!processed) {
	  		processed = true;
	  		this.processResult();
	  	}
	  });*/

		/* email registration */
	  var form = document.getElementById('regForm');
	  form.onsubmit = (event) => {
	    var spinner = document.getElementById('formWorking');
	    var donePage = document.getElementById('doneSec');
	    var regPage = document.getElementById('regSec');
		  form.style.display = 'none';
	    spinner.style.display = 'block';
      event.preventDefault();
      var email = document.getElementById('emailInput').value;
			user.register(email).then((response) => {
				console.log(response);
        spinner.style.display = 'none';
        if (response.data.status == true) {
        	this.formSections.toPage('doneSec');
        	var emailContent = '<head><meta charset="utf-8"></head>ご登録ありがとうございました。下記にあるリンクをクリックしてください。その後キャンペーンへの参加をお願いします<br><br><a href="https://rmarepo.richmediaads.com/o2o/familymart/demo/index.html?userId=' + email + '" target="_blank">https://rmarepo.richmediaads.com/o2o/familymart/demo/index.html?userId=' + email + '</a>';
        	user.sendEmail(email, 'FamilyMart Survey Link', emailContent);
        	// user.trackRegister();
        }
        else if (response.data.message == 'user exist.') {
        	user.info = response.data.user;
        	this.continue();
					modal.closeAll();
        }

			}).catch((error) => {
				console.log(error);
				form.style.display = 'block';
        spinner.style.display = 'none';
			});
    };

    /* twitter registration / login */
    var twitReg = document.getElementById('regTwitter');
    twitReg.onclick = () => {
      var regLoader = document.getElementById('regWorking');
      var regButtons = document.getElementById('regButtons');
      regLoader.style.display = 'block';
      regButtons.style.display = 'none';
			user.registerTwitter().then((result) => {
        // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
        // You can use these server side with your app's credentials to access the Twitter API.
        user.twitter.token = result.credential.accessToken;
        user.twitter.secret = result.credential.secret;
        var twitterId = result.additionalUserInfo.profile.id_str;
        this.initUser(twitterId, true, true);
      }).catch((error) => {
      	regLoader.style.display = 'none';
        regButtons.style.display = 'block';
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        alert(errorMessage);
        // ..
      });
    };

    var followBtn = document.getElementById('followBtn');
    followBtn.onclick = () => {
    	followBtn.style.display = 'none';
    	user.followTwitter().then((response) => {
				console.log(response);
	        if (response.data == 'followed!') {
	          var sMsg = document.getElementById('successFollow');
	          sMsg.style.display = 'block';
	          setTimeout(() => {
	            this.continue();
	          }, 2000);
	        }
    	}).catch((error) => {
				console.log(error);
				followBtn.style.display = 'block';
    	});
    }

    document.getElementById('toVideo').addEventListener('click', () => {
			setTimeout(() => {
				this.player.playVideo();
			}, 300);
    });
	  /* ==== Event Listeners End ==== */
	},
	checkTwitter: function() { // Check if user is following official page
		user.isFollowingTwitter().then((resp) => {
      console.log(resp);
      if (resp.data == 'following') {
				this.continue();
      }
      else {
		     this.pages.toPage('followPage');
      }
    }).catch((error) => {
      console.log(error);
      document.getElementById('regWorking').style.display = 'none';
      document.getElementById('regButtons').style.display = 'block';
    });
	},
	initUser: function(userId, autoRegister, isTwitter) {
		/* check if user is registered, if no, then register user, if yes, continue on where the user left off */
		user.get(userId).then((response) => {
			console.log(response);
    	if (response.data.status == false) { // user is not registered
	    	if (autoRegister) {
	    		user.register(userId).then((res) => { // auto register user
						console.log(res);
						user.isWanderer = false;
						user.info.id = userId;
						user.source = this.params.source;
						if (isTwitter) {
							this.checkTwitter();
						}
						else {
							this.continue();
						}
					  this.enableSaveAnswer();
					  // user.trackRegister();
	    		}).catch((err) => {
	    			user.isWanderer = true;
	    			console.log(err);
	    			this.pages.toPage('termsPage');
	    		});
	    	}
	    	else {
	    		this.pages.toPage('regPage');
	    		this.enableSaveAnswer();
	    	}
    	}
    	else { // user is registered
    		user.isWanderer = false;
				user.info = response.data.user;
				user.source = this.params.source;
				
				if (isTwitter) {
					this.checkTwitter();
				}
				else {
					this.continue();
				}
				this.enableSaveAnswer();
    	}
    }).catch((error) => {
    	user.isWanderer = true;
			console.log(error);
			this.pages.toPage('termsPage');
    });
	},
	enableSaveAnswer: function() {
    /* Auto save answer for every questions*/
	  var saveBtns = document.getElementsByClassName('saveQuestion');
	  for (var s = 0; s < saveBtns.length; s++ ) {
	  	saveBtns[s].addEventListener('click', (e) => {
	  		if (typeof(Storage) !== "undefined") {
					var answerJson = '{}';
	  			if (localStorage.getItem('localAnswers')) {
	  				answerJson = localStorage.getItem('localAnswers');
	  			}
	  			var localAnswers = JSON.parse(answerJson);
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
	  		// user.trackAnswer(this.params.userId, qNo, this.q[qNo].selectedAnswer);
			  /*user.saveAnswer(user.info.id, qNo, this.q[qNo].selectedAnswer).then((response) => {
			  	console.log(response);
			  }).catch((error) => {
			  	console.log(error);
			  });*/
	  	})
	 }
	},
	setQuestions() {
		/* ==== Set Questions ==== */
	  this.q[1] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q1'),
	  	question: '<span class="red">QUESTION 1</span><br>あなたの性別を教えてください',
	  	answers: [{
	    	value: '男性',
	    	text: '男性',
	    }, {
	    	value: '女性',
	    	text: '女性'
	    }],
	    nextBtn: document.getElementById('toQ2')
	  });
	  
	  this.q[2] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q2'),
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
	    nextBtn: document.getElementById('toQ3')
	  });

	  this.q[3] = new dropdownQuestion({
	  	wrapper: document.getElementById('q3'),
	  	question: '<span class="red">QUESTION 3</span><br>あなたのお住まいの地域は?',
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
	  	nextBtn: document.getElementById('toQ4')
	  });

	  this.q[4] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q4'),
	  	question: '<span class="red">QUESTION 4</span><br>スムージーを飲んだことはありますか？',
	  	answers: [{
	    	value: '飲んだことがある。',
	    	text: '飲んだことがある。',
	    }, {
	    	value: '飲んだことはないが、飲んでみたいと思う。',
	    	text: '飲んだことはないが、飲んでみたいと思う。'
	    }, {
	    	value: '飲んだことがない。',
	    	text: '飲んだことがない。'
	    }],
	    nextBtn: document.getElementById('toQ5')
	  });

	  this.q[5] = new singleAnswerQuestion({
	  	wrapper: document.getElementById('q5'),
	  	question: '<span class="red">QUESTION 5</span><br>コンビニにいく頻度を教えてください。',
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
	    nextBtn: document.getElementById('toQ6')
	  });

	  this.q[6] = new multipleAnswerQuestion({
	  	wrapper: document.getElementById('q6'),
	  	question: '<span class="red">QUESTION 6</span><br>いつも行くコンビニを教えてください',
	  	answers: [{
	    	value: 'ファミリーマート',
	    	text: 'ファミリーマート',
	    }, {
	    	value: 'セブン-イレブン',
	    	text: 'セブン-イレブン'
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
	    nextBtn: document.getElementById('toApply')
	  });
	  /* ==== Questions End ==== */
	},
	init: function() {
		var vidWidth = document.getElementById('vid').clientWidth;
    var vidHeight = document.getElementById('vid').clientHeight;

		/* init pagination */
		this.params = this.getParams();
		this.params.source = 'source1'; // dummy source
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
	  if (!this.params.userId || !this.params.source) {
		  user.isWanderer = true;
	    setTimeout(() => {
		    this.pages.toPage('regPage');
		    // this.pages.toPage('termsPage');
		  }, 1000);
	  }
	  else {
			this.initUser(this.params.userId, false);
		}

    /* get coupons */
		coupon.get(this.params.source);
	  
	  var processed = false; // check if result has been processed to avoid double result processsing

		//youtube api
    var ytScript = document.createElement('script');
    ytScript.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(ytScript, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      this.player = new YT.Player('vid', {
        height: vidHeight.toString(),
        width: vidWidth.toString(),
        playerVars: {'rel': 0,'showinfo': 0, 'controls': 0, 'playsinline': 1},
        videoId: 'OcoNMTSu8s8',
        events: {
          'onStateChange': (event) => {
            if (event.data == YT.PlayerState.ENDED) {
            	if (!processed) {
	            	processed = true;
	            	this.processResult();
								this.pages.toPage('resultPage');
							}
            }
          }
        }
      });
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