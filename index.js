var express = require("express");
var app = express();
const path = require('path')
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});
pool.connect();

var ebay = require('ebay-api');

var minutes = 0.5;
var interval = minutes * 60 * 1000;

setInterval(updatePrices, interval);


express()
	.use(express.static(path.join(__dirname, 'public')))
  	.set('views', path.join(__dirname, 'views'))
  	.set('view engine', 'ejs')
	.set("port", (process.env.PORT || 5000))
	.get('/', function(req, res) {
  		res.render('pages/requestForm');
	})
	.get("/getPrice", getPrice)
	.get("/getItem", getItem)
	.get("/login", login)
	.get("/createuser", createUser)
	.get("/newUserDetails", storeUser)
	.get("/main", mainRender)
	.get("/priceTable", priceTableRender)
	.get("/update", updateTest)
	.listen(process.env.PORT || 5000, function() {
		console.log("Now Listening on Port: ", app.get("port"));
	});

function getPrice(req, res) {
	var result = {yeet: "yeet"};
	res.json(result);
}

function priceTableRender(req, res) {
	pool.query('SELECT * FROM priceTable WHERE searchitem = \'' + req.query.item + '\';', function(err, result) {

		if (err) {
			console.log(err);
			console.log('SELECT * FROM priceTable WHERE searchitem = "' + req.query.item + '";')
			res.write("No information on item in database");
			res.end();
		}
		else {
			res.write("<html><head><title>Pricing</title></head><body>");
			res.write('<h1>Price History For: ' + res.query.item);
			res.write('<table>');
			res.write("<tr>");
			res.write("<th>Date</th>");
			res.write("<th>Item Price</th>");
			res.write("</tr>")

			result.rows.forEach(function(item) {
				res.write('<tr><td>');
				res.write(item.ts);
				res.write('</td><td>');
				res.write(item.price);
				res.write('</td></tr>')
			})
		}
	})
}

function storeQuery(query) {
	var sql = 'INSERT INTO item (searchitem, ts) VALUES (\'' + query + '\', CURRENT_TIMESTAMP);';
	pool.query(sql, function(err, result) {
		if (err) {
			console.log(err);
		}
		else console.log(result);
	})
}

function updateTest(req, res) {
	res.write("running update");
	res.end();
	updatePrices();
}

function updatePrices() {

	pool.query('SELECT * FROM item;', function(err, result) {

		if (err) {
			console.log(err);
		}
		else {
			result.rows.forEach(function(item) {
				var name = item.searchitem;
				var price = averagePrice(name);
				var sql = 'INSERT INTO pricetable (searchitem, ts, price) VALUES(\'' + name + '\', CURRENT_TIMESTAMP, ' + price.toString();
				pool.query(sql, function(err, result) {
					if (err) {
						console.log(err);
					}
					else console.log(result);
					})
			})
	}

})
};

function storeUser(req, res) {
	var sql = 'INSERT INTO storeusers (name, pass) VALUES(\'' + res.query.username + '\', \'' + res.query.password + '\');';

	pool.query(sql, function(err, result) {
		if (err) {
			console.log(err);
		}
		else console.log(result);
	})

	var obj = {
		user: res.query.username
	}

	mainRender(req, res);
}

function createUser(req, res) {
	res.render('pages/creatuserForm');
}

function login(req, res) {
	res.render('pages/loginform');
}

function averagePrice(item) {
	var params = {
		keywords: item
	};

	var price = 0;

	ebay.xmlRequest({
		serviceName: 'Finding',
		opType: 'findItemsByKeywords',
		appId: 'JasonPyl-cs313pro-PRD-92ccbdebc-dec6eadc',
		params: params,
		parser: ebay.parseResponseJson
	},

	function itemsCallback(error, itemsResponse) {
		if (error) throw error;

		var items = itemsResponse.searchResult.item;
		var length = items.length;

		

		for (var i = 0; i < length; i++) {
			price += items[i].sellingStatus.currentPrice.amount;
		}

		price /= length;

		console.log("Got price");
		return price;
	})

	console.log("Returnng");

}

function getItem(req, res) {
	var keyword = req.query.title;

	var params = {
	keywords: [keyword]
	};

	ebay.xmlRequest({
		serviceName: 'Finding',
		opType: 'findItemsByKeywords',
		appId: 'JasonPyl-cs313pro-PRD-92ccbdebc-dec6eadc',
		params: params,
		parser: ebay.parseResponseJson
	},

	function itemsCallback(error, itemsResponse) {
		if (error) throw error;
		var items = itemsResponse.searchResult.item;
		console.log('Found', items.length, 'items');

		res.write("<html><head><title>Pricing</title></head><body>");
		res.write('<table>');
		res.write("<tr>");
		res.write("<th>ebay Item ID</th>");
		res.write("<th>Item Name</th>");
		res.write("<th>Item Price</th>");
		res.write("</tr>")
		
		for (var i = 0; i < 100; i++) {
			res.write('<tr>');

			res.write('<td>');
			res.write(items[i].itemId);
			res.write('</td>');

			res.write('<td>');
			res.write(items[i].title);
			res.write('</td>');

			res.write('<td>');
			res.write("$" + items[i].sellingStatus.currentPrice.amount);
			res.write('</td>');

			res.write('</tr>')
		}
		res.end();
        storeQuery(keyword);
	})
}

function mainRender(req, res) {
	res.write("<html><head><title>Pricing</title></head><body>");
	res.write('<table>');
	res.write('<tr>');
	res.write('<th>Previously searched items');
	
	pool.query('SELECT * FROM item;', function(err, result) {
		if (err) {
			console.log(err);
		}
		else {
			result.rows.forEach(function(item) {
				res.write('<tr><td>');
				res.write('<a href="/priceTable?item=' + item.searchitem + '">' + item.searchitem + '</a>');
				res.write('</td></tr>')
			})
			console.log(result);
			res.write('</body></html>');
			res.end();
		}
	})
};