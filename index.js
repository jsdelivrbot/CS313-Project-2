const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

function calculateRate(postage, weight) {
	switch (postage) {
		case "stamped":
			if (weight >= 3.5) {
				return 1.13;
			}
			else {
				return Math.ceil(weight - 1) * 0.21 + 0.5;
			}
		case "metered":
			if (weight >= 3.5) {
				return 1.10;
			}
			else {
				return Math.ceil(weight - 1) * 0.21 + 0.47; 
			}
		case "flat":
			if (weight >= 13) {
				return 3.52;
			}
			else {
				return Math.ceil(weight - 1) * 0.21 + 1;
			}
		case "firstClass":
			if (weight <= 4)
				return 3.50;
			else if (weight <= 8)
				return 3.75;
			else if (weight <= 9)
				return 4.10;
			else if (weight <= 10)
				return 4.45;
			else if (weight <= 11)
				return 4.80;
			else if (weight <= 12)
				return 5.15;
			else
				return 5.50;
	}
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', function(req, res) {
  	res.render('pages/mailForm');
  })
  .get('/getMail', function(req, res) {
  	let first = req.query.operator;
    let second = parseInt(req.query.weight);
    let rate = Math.round(calculateRate(first, second) * 100) / 100;

    let obj = {
            'rate': rate,
        }
    res.render('pages/postage', obj);
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))


