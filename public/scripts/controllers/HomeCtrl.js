'use strict';

angular.module('shouldImine')
.controller('HomeCtrl', ['$scope',
	function($scope) {



		var localHashRate = 500;

		var arrx = [];
		var len = hashRateData.length;
		for (var i = 0; i < len; i++){
			arrx.push(((hashRateData[i].x)-1375294505)/86400);
		}

		var arry = [];
		len = hashRateData.length;
		for (i = 0; i < len; i++){
			arry.push(hashRateData[i].y);
		}

		var equationData = [];
		var lenxy = arry.length;
		for (i=1; i < lenxy; i++){
			equationData.push([arrx[i], arry[i]]);
		}

		var arrxy = [];
		lenxy = arry.length;
		for (i=1; i < lenxy; i++){
			arrxy.push({
				'x': hashRateData[i].x*1000,
				'y': arry[i]
			});
		}
		var plotline = [];
		for (i = 0; i < lenxy; i++) {
			if(i%(90) === 0){
				plotline.push({
					'x': arrx[i]*86400000+1406748573000, 
					'y': -1162586326.41 + 219833429.61*Math.log(arrx[i]+(lenxy-2))
				});
			}
		}

		var slicedEquationData = equationData.slice(200,363);

		plotline.splice(0, 1, arrxy[lenxy-2]);

		var result = regression('logarithmic', slicedEquationData,3);

		var value;
		$("input").on("keyup change", function(){
			value = this.value; 
			$("#dom_element").text(value);
		});

		var staticValue;
		$("#updateHashRateButton").on("click", function(){
			staticValue = value;
		});


		var chart = new Highcharts.Chart({
			chart: {
				type: 'spline',
				renderTo: 'container',
				animation:'Highcharts.svg'
			},
			title: {
				text: 'Network Hash Rate Prediction'
			},
			yAxis: {
				min: 0,
				title: {
					enabled: true,
					text: 'Network Hash Rate GH/s',
					style: {
						fontWeight: 'normal'
					}
				}
			},
			xAxis: {
				type: 'datetime',
				tickPixelInterval: 150,
				min: 1400000000000,
				max: 1400000000000+staticValue*86400000*30,
				startOnTick: true,
				scalable: true
			},
			plotOptions: {
				series: {
					cursor: 'ns-resize',
					point: {
						events: {
							drag: function (e) {
								if (e.newY > 1000000000000) {
									this.y = 1000000000000;
									return false;
								}
							},
							drop: function () {
								var epoch = parseInt(this.category);
								var date = new Date(epoch);
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
				name: ' ',
				data: arrxy,
				draggableY: false,
				draggableX: false,
				marker: {
					enabled: false,
					radius: 0
				}
			},
			{
				name: 'user network hash rate prediction',
				data: plotline,
				draggableY: true,
				draggableX: true,
				color: '#99CCCC'
			}
			]
		});
/*

$('#drop').html(
		this.series.name + '</b>, <b>' + date + '</b> was set to <b>' + Highcharts.numberFormat(this.y, 2) + '</b>' + ' GH/s');
var BTCMined = (((localHashRate*(plotline[1].x-plotline[0].x))/((plotline[0].y*(plotline[1].x-plotline[0].x))+(.5*((plotline[1].x-plotline[0].x)*(plotline[1].y-plotline[0].y)))))*(plotline[1].x-plotline[0].x)*0.00008333333)+ 

(((localHashRate*(plotline[2].x-plotline[1].x))/((plotline[1].y*(plotline[2].x-plotline[1].x))+(.5*((plotline[2].x-plotline[1].x)*(plotline[2].y-plotline[1].y)))))*(plotline[2].x-plotline[1].x)*0.00008333333) + 

(((localHashRate*(plotline[3].x-plotline[2].x))/((plotline[2].y*(plotline[3].x-plotline[2].x))+(.5*(( plotline[3].x-plotline[2].x)*(plotline[3].y-plotline[2].y)))))*(plotline[3].x-plotline[2].x)* 0.00008333333) + 

(((localHashRate*(plotline[4].x-plotline[3].x))/((plotline[3].y*(plotline[4].x-plotline[3].x))+(.5*((plotline[4].x-plotline[3].x)*(plotline[4].y-plotline[3].y)))))*(plotline[4].x-plotline[3].x)*0.00008333333) 

;

$('#drag').html(
	'Bitcoins mined in one year: <b>' + BTCMined);
},


*/

}]);