import coupon from './coupon';

var winningLogic = {
	winLogic: {
		'5': {
			value: ['ほぼ毎日', '週４〜５回', '週２〜３回'],
			priority: [2, 3, 4] // smaller number means higher priority. i.e. if user got Q6 and Q8 correct, winLogic of Q6 will be used because priority number of Q8 is higher.
		},
		'7': {
			value: 'セブン-イレブン',
			priority: 5
		}
	},
	loseLogic: {
		/*'6': {
			value: '月１回未満',
			priority: 1
		}*/
	},
	process: function(questions, considerGroup) {
		var winPrio = 20;
		var losePrio = 10;
    for (var w in this.winLogic) {
    	var no = parseInt(w);
    	if (typeof this.winLogic[w].value === 'string') {
				if (questions[no].selectedAnswer.indexOf(this.winLogic[w].value) > -1) {
					winPrio = winPrio > this.winLogic[w].priority ? this.winLogic[w].priority : winPrio;
				}
    	}
    	else {
    		for (var v = 0; v < this.winLogic[w].value.length; v++) {
    			if (questions[no].selectedAnswer.indexOf(this.winLogic[w].value[v]) > -1) {
    				winPrio = winPrio > this.winLogic[w].priority[v] ? this.winLogic[w].priority[v] : winPrio;
    			}
    		}
    	}
    }

    for (var l in this.loseLogic) {
    	var n = parseInt(l);
    	if (typeof this.loseLogic[l].value === 'string') {
    		if (questions[n].selectedAnswer.indexOf(this.loseLogic[l].value) > -1) {
    			losePrio = losePrio > this.loseLogic[l].priority ? this.loseLogic[l].priority : losePrio;
    		}
    	}
    	else {
    		for (var u = 0; u < this.loseLogic[l].value.length; u++) {
    			if (questions[n].selectedAnswer.indexOf(this.loseLogic[l].value[u]) > -1) {
    				losePrio = losePrio > this.loseLogic[l].priority[u] ? this.loseLogic[l].priority[u] : losePrio;
    			}
    		}
    	}
    }
    
    var trackingResult = 'lose'; // result to be tracked via custom ad tracking
    var groups = ['','','A','B','C','D'];
    var group = 'NA';
    var flag = '0'; // result to be stored in client side
    var actualResult = 'lose' // result to be stored to db via /mark_user, also shown in result page

    if (questions[6].selectedAnswer.indexOf('セブン-イレブン') < 0) {
      trackingResult = 'lose';
    }
    else {
      if (winPrio < losePrio) {
        trackingResult = 'win';
        actualResult = 'win';
        flag = '1';
        if (considerGroup) {
          group = groups[winPrio];
          if (coupon.count[group] < 1) {
            if (group == 'A' || group == 'B' || group == 'C') {
              if (questions[7].selectedAnswer == 'セブン-イレブン' && coupon.count['D'] > 0) {
                group = 'D';
                actualResult = 'win';
                flag = '1';
              }
              else {
                actualResult = "lose";
                flag = '0';
              }
            }
            else {
              actualResult = "lose";
              flag = '0';
            }
          }
        }   
      }
    }
    return {
      trackingResult: trackingResult,
      actualResult: actualResult,
      flag: flag,
      group: group
    }
	}
}

export {
  winningLogic,
  coupon
} 