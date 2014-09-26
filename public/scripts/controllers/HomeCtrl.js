'use strict';

angular.module('shouldImine')
.controller('HomeCtrl', ['$scope',
	function($scope) {

		// historical data
		var hashRateData = [];
		var btcHashrateRef = new Firebase('https://shouldimine.firebaseIO.com/bitcoin');

		// get the historicalData from firebase
		btcHashrateRef.child('historicalHashrateData').once('value', function(snap){
			hashRateData = snap.val();
			hashRateData.splice(0, 1500);
			initAll();
		});

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

			$scope.userUpfrontCost = 0;
			$scope.userMonthlyCost = 0;
			$scope.yourHashRate = 1000;
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

				// calculate coins mined
				var milliSecondsInADay = 24*60*60*1000;
				var dayNumber = 1;
				var totalCoinsMined = 0;
				var time;

				while(dayNumber <= 720){
					time = now + (dayNumber)*24*60*60*1000;
					var coinsMindedThatDay = $scope.yourHashRate/Math.floor(
						theirPredictionRegression.equation[0] + 
						theirPredictionRegression.equation[1]*time + 
						theirPredictionRegression.equation[2]*Math.pow(time, 2) + 
						theirPredictionRegression.equation[3]*Math.pow(time, 3))*coinsMindInOneDay/1000;
					totalCoinsMined += coinsMindedThatDay;
					dayNumber++;
				}
				// plot the new regressiong
				newRegression = [];
				for (i = 0; i <= 24; i++) {
					time = now+miliSecondsInSixMonths*i/6;
					newRegression.push({
						'x': time,
						'y': Math.floor(theirPredictionRegression.equation[0] + theirPredictionRegression.equation[1]*time + theirPredictionRegression.equation[2]*Math.pow(time, 2) + theirPredictionRegression.equation[3]*Math.pow(time, 3))
					});
				}

				//chart.series[2].setData(newRegression,true);

				$scope.totalCosts = $scope.userUpfrontCost + $scope.userMonthlyCost*24;
				$scope.coinsMined = totalCoinsMined;
			};
		}

}]);