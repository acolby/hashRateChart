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
					},
					{
						name: 'calculated regression',
						data: newRegression,
						draggableY: false,
						draggableX: false,
						color: '#328bb5'
					}	
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
				
				var theirPredictionRegression = regression('polynomial', theirPerdictionPoints, 3);

				var xValues = [];
				var yValues = [];
				for(i = 0; i < theirPerdictionPoints.length; i++){
					xValues.push(theirPerdictionPoints[i][0]);
					yValues.push(theirPerdictionPoints[i][1]);
				}

				var times = numeric.linspace(xValues[0],xValues[4],730);
				var hashRates = numeric.spline(xValues,yValues).at(times);

				// calculate coins mined
				var totalCoinsMined = 0;
				for(i = 0; i < hashRates.length; i++){
					var coinsMindedThatDay = $scope.yourHashRate/hashRates[i]*coinsMindInOneDay/1000;
					totalCoinsMined += coinsMindedThatDay;
				}
				// plot the new regressiong
				/*
				newRegression = [];

				for (i = 0; i < times.length; i++) {
					time = now+miliSecondsInSixMonths*i/6;
					newRegression.push({
						'x': times[i],
						'y': hashRates[i]
					});
				}

				chart.series[1].setData(newRegression,true);
				*/

				$scope.totalCosts = $scope.userUpfrontCost + $scope.userMonthlyCost*24;
				$scope.coinsMined = totalCoinsMined;

				// data to push to firebase
				anonomousAnalyticsMyRef.child('claculations').push({
					'ourPredictionPoints': theirPerdictionPoints,
					'predictionPoints': ourprediction,
					'fixedCosts': $scope.userUpfrontCost,
					'variableCosts': $scope.userMonthlyCost,
					'hashRate': $scope.yourHashRate
				});
			};
		}
	}
]);