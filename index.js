var express = require("express");
var app = express();
const path = require('path')
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({connectionString: connectionString});
pool.connect();

var ebay = require('ebay-api');
//EBAY PARAMS:
//itemID = unique identifier
//convertedCurrentPrice.amount

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
	.listen(process.env.PORT || 5000, function() {
		console.log("Now Listening on Port: ", app.get("port"));
	});

function getPrice(req, res) {
	var result = {yeet: "yeet"};
	res.json(result);
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

	mainRender(res, obj);
}

function createUser(req, res) {
	res.render('pages/creatuserForm');
}

function login(req, res) {
	res.render('pages/loginform');
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
	})

	setTimeout(function(){
        res.end();
        storeQuery(keyword);
    }, 2000);
}

function mainRender(res, obj) {
	res.write("<html><head><title>Pricing</title></head><body>");
	res.write('<table>');
	res.write('<tr>');
	res.write('<th>Previously searched items');
	
	pool.query('SELECT * FROM item;', function(err, result) {
		result.forEach(function(item) {
			res.write('<tr><td>');
			res.write(item);
			res.write('</td></tr>')
		})
	})
}