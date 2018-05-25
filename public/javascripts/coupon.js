import axios from 'axios';

var domain = 'https://www.mobileads.com';
// var domain = 'http://localhost:8080';

var coupon = {
	count: {
		A: 0,
		B: 0,
		C: 0,
		D: 0
	},
	get: function(source) {
		/*var _this = this;
    axios.get(domain + '/api/coupon/softbank/coupons_check', {
    	params: {
    		source: source
    	}
    }).then(function(response) {
      console.log(response);
      _this.count.A = response.data.A;
      _this.count.B = response.data.B;
      _this.count.C = response.data.C;
      _this.count.D = response.data.D;
    }).catch(function(error) {
      console.log(error);
    });*/


        
    this.count.A = 10;
    this.count.B = 10;
    this.count.C = 0;
    this.count.D = 0;

	}
}

export default coupon;