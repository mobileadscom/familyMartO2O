import coupon from './coupon';

var winningLogic = {
	winLogic: {
    '6': {
      value: ['セブン-イレブン', 'ローソン'],
      priority: [2, 3] // smaller number means higher priority.
    }
		/*'5': {
			value: ['ほぼ毎日', '週４〜５回', '週２〜３回'],
			priority: [2, 3, 4] 
		},
		'7': {
			value: 'セブン-イレブン',
			priority: 5
		}*/
	},
	loseLogic: {
		/*'6': {
			value: '月１回未満',
			priority: 1
		}*/
	},
  eligibility: [], // store eligible win
	process: function(questions, considerGroup) {
		var winPrio = 20;
		var losePrio = 10;
    for (var w in this.winLogic) {
    	var no = parseInt(w);
    	if (typeof this.winLogic[w].value === 'string') {
				if (questions[no].selectedAnswer.indexOf(this.winLogic[w].value) > -1) {
					winPrio = winPrio > this.winLogic[w].priority ? this.winLogic[w].priority : winPrio;
          this.eligibility.push(this.winLogic[w].priority);
				}
    	}
    	else {
    		for (var v = 0; v < this.winLogic[w].value.length; v++) {
    			if (questions[no].selectedAnswer.indexOf(this.winLogic[w].value[v]) > -1) {
            winPrio = winPrio > this.winLogic[w].priority[v] ? this.winLogic[w].priority[v] : winPrio;
            this.eligibility.push(this.winLogic[w].priority[v]);
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
    var groups = ['','','A','B']; // array index follow priority. e.g. for win priority 2, the corresponding group has to be groups[2]
    var group = 'NA';
    var flag = '0'; // result to be stored in client integration side
    var actualResult = 'lose' // result to be stored to db via /mark_user, also shown in result page


    if (winPrio < losePrio) {
      trackingResult = 'win';
      actualResult = 'win';
      flag = '1';
      if (considerGroup) {
        if (coupon.count) {
          group = groups[winPrio];
          var eGroup = [];
          /* filter out eligible group that has no more coupons left */
          /* eligible group that still has coupons will be in eGroup */
          for (var e = 0; e < this.eligibility.length; e++) {
            var cGroup = groups[this.eligibility[e]];
             
            if (coupon.count[cGroup] > 0) {
              eGroup.push(this.eligibility[e]);
            }
          }
          
          if (eGroup.length > 0) {
            eGroup.sort((a, b) => a - b) // For ascending sort
            group = groups[eGroup[0]]; // pick the first priority
          }
          else { // all coupons has been used up.
            actualResult = "lose";
            flag = '0';
          }
        }
        else { // coupon data not available
          actualResult = "lose";
          flag = '0';
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