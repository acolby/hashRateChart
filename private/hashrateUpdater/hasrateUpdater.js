'use strict';

var curl = require('node-curl');
var Firebase = require('firebase');

var btcHashrateRef = new Firebase('https://shouldimine.firebaseIO.com/bitcoin');

curl('https://blockchain.info/charts/hash-rate?showDataPoints=false&timespan=all&show_header=true&daysAverageString=1&scale=0&format=json&address=', function(err) {
	var values = JSON.parse(this.body).values;
	btcHashrateRef.child('historicalHashrateData').set(values, function(){
		console.log('done');
	});
  });