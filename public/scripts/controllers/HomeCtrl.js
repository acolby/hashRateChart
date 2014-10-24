'use strict';

angular.module('shouldImine')
.controller('HomeCtrl', ['$scope', '$cookieStore',
	function($scope, $cookieStore) {

		// historical data
		var hashRateData = [];
		var btcHashrateRef = new Firebase('https://shouldimine.firebaseIO.com/bitcoin');

		// analytics
		var anonomousAnalyticsRef = new Firebase('https://shouldimine.firebaseIO.com/bitcoin/anonomousAnalytics');
		var anonomousAnalyticsKey = $cookieStore.get('_shouldimineAnonomousAnalyticsCookee');
		if (anonomousAnalyticsKey === undefined) {
			var aref = anonomousAnalyticsRef.push({}).toString().split('/');
			anonomousAnalyticsKey = aref[aref.length - 1];
			$cookieStore.put('_shouldimineAnonomousAnalyticsCookee', anonomousAnalyticsKey);
		}
		var anonomousAnalyticsMyRef = anonomousAnalyticsRef.child(anonomousAnalyticsKey);

		// get the historicalData from firebase
		btcHashrateRef.child('historicalHashrateData').once('value', function(snap){
			hashRateData = snap.val();
			hashRateData.splice(0, 1500);
			initAll();
		});

		$scope.userUpfrontCost = 2500;
		$scope.userMonthlyCost = 72;
		$scope.yourHashRate = 4500;

		function initAll(){
			// to make regressionProdiction data needs to be of form
			/*
				data = [
					[x,y]
				]
				// x = time in epoch
				// y = hasrate in TH/s
			*/
			var previousData = [];
			for (var i = 0; i < hashRateData.length; i++) {
				previousData.push([hashRateData[i].x*1000, hashRateData[i].y/1000]);
			}

			// calculate prediciton
			var regressionProjection = regression('polynomial', previousData, 3);

			// cancluate points every six months for the next two years
			var miliSecondsInSixMonths = 60*60*24*30*6*1000;
			var now = new Date().getTime();
			var timeTwoYearsFromNow = now+miliSecondsInSixMonths*4;

			var prediction = [];
			var ourprediction = [];
			for (i = 0; i <= 4; i++) {
				var time = now+miliSecondsInSixMonths*i;
				prediction.push({
					'x': time,
					'y': Math.floor(regressionProjection.equation[0] + regressionProjection.equation[1]*time + regressionProjection.equation[2]*Math.pow(time, 2) + regressionProjection.equation[3]*Math.pow(time, 3))
				});
				ourprediction.push({
					'x': time,
					'y': Math.floor(regressionProjection.equation[0] + regressionProjection.equation[1]*time + regressionProjection.equation[2]*Math.pow(time, 2) + regressionProjection.equation[3]*Math.pow(time, 3))
				});
			}

			var newRegression = [];

			var chart = new Highcharts.Chart({
				chart: {
					type: 'spline',
					renderTo: 'container',
					animation: true
				},
				title: {
					text: ''
				},
				yAxis: {
					min: 0,
					title: {
						enabled: true,
						text: 'Network Hash Rate TH/s',
						style: {
							fontWeight: 'normal'
						}
					}
				},
				xAxis: {
					type: 'datetime',
					tickPixelInterval: 150,
					min: now,
					max: timeTwoYearsFromNow,
					scalable: true
				},
				plotOptions: {
					series: {
						cursor: 'ns-resize',
						point: {
							events: {
								drag: function (e) {
									
								},
								drop: function () {

								}
							},
							stickyTracking: false,
						},
						column: {
							stacking: 'normal'
						},
						tooltip: {
							yDecimals: 0
						},
					}
				},
				series: [
					{
						name: 'our prediction',
						data: ourprediction,
						marker:{
							enabled: false
						},
						dataLabels: {
							enabled: false
						},
						draggableY: false,
						draggableX: false,
						color: '#CCCCCC'
					},
					{
						name: 'your prediction',
						data: prediction,
						draggableY: true,
						draggableX: false,
						color: '#32b69e'
					}/////,
					/////{
					/////	name: 'calculated regression',
					/////	data: newRegression,
					/////	draggableY: false,
					/////	draggableX: false,
					/////	color: '#328bb5'
					/////}	
				]
			});

			$scope.coinsMined = null;
			$scope.totalCosts = null;
			$scope.calculateBtcMined = function(){
				var coinsMindInOneDay = 24*6*25;
				// validate the inputs
				// conver to xy data
				var theirPerdictionPoints = [];
				for(var i = 0; i < chart.series[1].xData.length; i++){
					theirPerdictionPoints.push([
						chart.series[1].xData[i],
						chart.series[1].yData[i]
					]);
				}

				var hashRateTrapazoidAproximation = calculateTrapazoidAproximationFunction(theirPerdictionPoints);

				var numberOfSecondsMiliSecondsInOneDay = 24*60*60*1000;
				var timePointer = theirPerdictionPoints[0][0] + numberOfSecondsMiliSecondsInOneDay;
				var coinsMined = 0;
				newRegression = [];
				while(timePointer < theirPerdictionPoints[4][0]){
					var coinsMindedThatDay =  $scope.yourHashRate/hashRateTrapazoidAproximation(timePointer)*coinsMindInOneDay/1000;
					coinsMined = coinsMined + coinsMindedThatDay;
					timePointer += numberOfSecondsMiliSecondsInOneDay;
					newRegression.push({
						'x': timePointer,
						'y': hashRateTrapazoidAproximation(timePointer)
					});
				}
				////// chart.series[2].setData(newRegression,true);
				
				$scope.totalCosts = $scope.userUpfrontCost + $scope.userMonthlyCost*24;
				$scope.coinsMined = coinsMined;

				// data to push to firebase
				anonomousAnalyticsMyRef.child('claculations').push({
					'ourPredictionPoints': theirPerdictionPoints,
					'predictionPoints': ourprediction,
					'fixedCosts': $scope.userUpfrontCost,
					'variableCosts': $scope.userMonthlyCost,
					'hashRate': $scope.yourHashRate
				});
			};

			function calculateTrapazoidAproximationFunction(p){ // input is the prediction point is form [[x0, y0], [x1, y1]... [xN, yN]]

				// two point form y = (y2 - y1)/(x2 - x1)(x - x1) + y1
				var curve1 = function(time){
					return ((p[1][1] - p[0][1])/(p[1][0] - p[0][0]))*(time - p[0][0]) +  p[0][1];
				};
				var curve2 = function(time){
					return ((p[2][1] - p[1][1])/(p[2][0] - p[1][0]))*(time - p[1][0]) +  p[1][1];
				};
				var curve3 = function(time){
					return ((p[3][1] - p[2][1])/(p[3][0] - p[2][0]))*(time - p[2][0]) +  p[2][1];
				};
				var curve4 = function(time){
					return ((p[4][1] - p[3][1])/(p[4][0] - p[3][0]))*(time - p[3][0]) +  p[3][1];
				};

				return function(time){
					if(time < p[0][0]){
						return 0;
					}else if(time < p[1][0]){
						// use curve 1
						return curve1(time);
					}else if(time < p[2][0]){
						// use curve 2
						return curve2(time);
					}else if(time < p[3][0]){
						// use curve 3
						return curve3(time);
					}else{
						// use curve 4
						return curve4(time);
					}
					return curve1(time);
				};
			}
		}
	}
]);