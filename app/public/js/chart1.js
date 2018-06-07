var lineChartData = {
			labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
			datasets: [{
				label: 'Queries / Seconds',
				cubicInterpolationMode: 'monotone',
				borderColor: window.chartColors.red,
				backgroundColor: window.chartColors.red,
				fill: false,
				data: [
				 {x: 1, y:4},
					{x:0.5, y:3},
					{x:3, y:2},
					{x:4, y:1},
					{x:5, y:1},
					{x:6, y:1}
				],
				xAxisId: 'x-axis-1',
				yAxisID: 'y-axis-1',
			}, {
				label: 'Failurs / s',
				lineTension: 0,
				borderColor: window.chartColors.blue,
				backgroundColor: window.chartColors.blue,
				fill: false,
				data: [
					 {x: 1, y:3},
					{x:2.5, y:2},
					{x:3, y:2},
					{x:4, y:7},
					{x:5, y:3},
					{x:10, y:5}
				],
				xAxisId: 'x-axis-1',
				yAxisID: 'y-axis-2'
			},
		 {
				label: 'Failurs / s',
				steppedLine: true,
				borderColor: window.chartColors.yellow,
				backgroundColor: window.chartColors.yellow,
				fill: false,
				data: [ {x: 1, y:3},
					{x:2.5, y:2},
					{x:3, y:2},
					{x:4, y:2},
					{x:5, y:3},
					{x:6, y:4}
				],
				xAxisId: 'x-axis-1',
				yAxisID: 'y-axis-3'
		 }
		]
		};

		window.onload = function() {
			var ctx = document.getElementById('canvas').getContext('2d');
			window.myLine = Chart.Line(ctx, {
				data: lineChartData,
				options: {
					responsive: true,
					hoverMode: 'index',
					stacked: false,
					title: {
						display: true,
						text: 'Line Chart x/a'
					},
					scales: {
						xAxes: [{
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'left',
							id: 'x-axis-1',
							label : 'time'
						}],
						yAxes: [{
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'left',
							id: 'y-axis-1',
							labelString : '%CPU/%MEM',
						}, {
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							position: 'right',
							id: 'y-axis-2',
							scaleLabel: {
							display: true,
							labelString: '%CPU'
							},
							// grid line settings
							gridLines: {
								drawOnChartArea: false, // only want the grid lines for one axis to show up
							},
						},
						{
							type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
							display: true,
							borderColor : window.chartColors.blue,
							backgroundColor: window.chartColors.blue,
							position: 'left',
							id: 'y-axis-3',
						}
					],
					}
				}
			});
		};

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

		document.getElementById('updateQuery').addEventListener('click', function() {
			lineChartData.datasets.forEach(function(dataset) {
				dataset.data.push({ x: dataset.data.length, y : getRandomInt(8) });
			});
			window.myLine.update();
		});

