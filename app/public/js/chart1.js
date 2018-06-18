function makeYAverage (X, Y, min, max, factor, sample) {
  var last = Y[0];
  var newY = [];
  var j = 0;
  for (var i = 0; i < factor; ++i) {
    var sum = last;
    var cnt = 1;
    var max_i = min + (i + 1) * (max - min) / factor;
    while(j < X.length && X[j] < max_i) {
      last = Y[j];
      sum += last;
      cnt++;
      ++j;
    }
    if (sample) {
      newY.push(last);
    } else {
      newY.push(sum / cnt);
    }
  }
  return newY;
}


var hiddenSets = [ 'MAXMEM', 'NP'];




function removeHalfData (sample) {
  var min = x.reduce((prev, val) => Math.min(prev, val), 2000000000);
  var max = x.reduce((prev, val) => Math.max(prev, val), 0);
  var factor = 300;
  var newX = [];
  for (var i = 0; i < factor; ++i) {
    newX.push(Math.floor(min + ((max - min) * i) / factor));
  }
  var X = x;
  Object.keys(ys).forEach(key => {
    Y = ys[key];
    ys[key] = makeYAverage(X, Y, min, max, factor, sample);
  });
  lineChartData.datasets.forEach(ds => {
    var X = ds.data.map(a => a.x);
    var Y = ds.data.map(a => a.y);
    var newY = makeYAverage(X, Y, min, max, factor, sample);
    ds.data = newX.map((x, index) => {
      return { x: x,  y: newY[index]};});
  });
  x = newX;
/*
	x = x.filter( (val,index) => index % 4 == 0)
	Object.keys(ys).forEach( key => {
       ys[key] = ys[key].filter( (val,index) => index % 4 == 0)
	}
	)
	lineChartData.datasets.forEach( ds =>
		ds.data = ds.data.filter( (val,index) => index % 4 == 0)
	)
  */
  window.myLine.update();
}

function removeHalfDataLeft () {
  if (x.length < 5) {
    return;
  }
  var half = Math.floor(x.length / 2);
  x = x.slice(half);
  Object.keys(ys).forEach(key => {
    ys[key] = ys[key].slice(half);
  });
  lineChartData.datasets.forEach(ds => {
    ds.data = ds.data.slice(half);
  });
  window.myLine.update();
}

var metadata = {
  QPS: {
    label: 'Query/second',
    axis: {
      id: 'qps',
      color: 'green',
      labelString: 'Query/s'
    },
    color: 'green'
  },
  FAIL: {
    label: 'Fail %',
    axis: {
      id: 'perc',
      max: 100,
      min: 0,
      gridLines: true,
      color: 'black',
      labelString: 'Fail %'
    },
    color: 'red'
  },
  MAXMEM: {
    label: 'Max Memory',
    axis: {
      id: 'maxmem',
      min : 0,
      color: 'orange',
      labelString: 'MB'
    },
    color: 'orange'
  },
  PAR: {
    label: 'PAR',
    axis: {
      id: 'par',
      min: 0,
      color: 'blue',
      labelString: ''
    },
    color: 'blue'
  },
  NP: {
    label: 'par',
    axis: {
      id: 'par',
      min: 0,
      color: 'blue',
      labelString: ''
    },
    color: 'blue'
  },
  DUR: {
    label: 'plan dur',
    axis: {
      id: 'duration',
      min: 0,
      color: 'goldenrod',
      labelString: 'ms'
    },
    color: 'goldenrod'
  },
  CPU: {
    label: 'CPU',
    axis: {
      id: 'perc',
      color: 'black',
      min: 0,
      max: 100,
      labelString: '%CPU / MEM'
    },
    color: 'yellow'
  },
  MEM: {
    label: 'MEM',
    axis: {
      id: 'perc',
      color: 'black',
      gridLines: true,
      min: 0,
      max: 100,
      labelString: '%CPU / MEM'
    },
    color: 'brown'
  }
};

var MAXMEM = 10;
var CPU = 200;
var MEM = 1;
var FAIL = 0;
var PAR = 3;
var QPS = 3;
var NP = 7;
var DUR = 3;
var time = 100;

function addIt () {
  time += 2;
  MAXMEM += 10;
  QPS = (MAXMEM % 100 - 50) * Math.sin(time / 1000);
  MEM = 100 * Math.abs(Math.sin(time / 30));
  CPU = 100 * Math.abs(Math.cos(time / 29));
  FAIL = 25 * Math.abs(Math.cos(time / 25));
  DUR = CPU + 2;
  var rec = {
    time: time,
    QPS: QPS,
    FAIL: FAIL,
    MEM: MEM,
    CPU: CPU,
    NP: NP,
    PAR: PAR,
    DUR : DUR,
    MAXMEM: MAXMEM
  };
  addChartRecord(rec);
  setTimeout(addIt, 2000);
}

// setTimeout(addIt,500)

function amendArray (arr, len) {
  while(arr.length < len){
    var val = arr.length > 0 ? arr[arr.length - 1] : 0;
    arr.push(val);
  }
}

var keys = [];

function assureKeys (key) {
  if (keys.indexOf(key) < 0) {
    keys.push(key);
  }
}

function createYAxis (lineChartData, mdaxis) {
  if (lineChartOptions.scales.yAxes.filter(x => x.id == mdaxis.id).length) {
    return; // present!
  }
  var yaxis = {
    type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
    display: true,
    position: (mdaxis.position) ? mdaxis.position : 'right',
    id: mdaxis.id,
    scaleLabel: {
      display: true,
      labelString: mdaxis.labelString
    },
    // grid line settings
    gridLines: {
      drawOnChartArea: false, // only want the grid lines for one axis to show up
    }
  };
  if (mdaxis.color) {
    yaxis.ticks = { fontColor: mdaxis.color};
  }
  yaxis.gridLines = {
    drawOnChartArea: !!mdaxis.gridLines, // only want the grid lines for one axis to show up
  };
  if (mdaxis.hasOwnProperty('min')) {
    yaxis.ticks.min = mdaxis.min;
  }
  if (mdaxis.hasOwnProperty('max')) {
    yaxis.ticks.max = mdaxis.max;
  }
  lineChartOptions.scales.yAxes.push(yaxis);
}

function assureDataset (key, index , metadata) {
  var md = metadata[key];
  while(index >= lineChartData.datasets.length){
    createYAxis(lineChartData, md.axis);
    lineChartData.datasets.push(
      {
        label: md.label,
        cubicInterpolationMode: 'monotone',
        borderColor: md.color, // #FF00FF",
        backgroundColor: md.color, // window.chartColors.red,
        fill: false,
        data: [
          /*
			{x: 1, y:4},
			{x:0.5, y:3},
			{x:3, y:2},
			{x:4, y:1},
			{x:5, y:1},
			{x:6, y:1}
			*/
        ],
        xAxisId: 'x-axis-1',
        yAxisID: md.axis.id, // 'y-axis-1',
      }
    );
  // reinitChart()
  }
}

var x = [];
var ys = {};

function addChartRecord (recs) {
  var keysLength = keys.length;
  x.push(recs.time);
  delete recs.time;
  Object.keys(ys).forEach(key => {
    assureKeys(key);
    var arr = ys[key];
    if (recs.hasOwnProperty(key)) {
      amendArray(arr, x.length);
      arr[x.length - 1] = parseFloat(recs[key]);
    } else {
      var arr = ys[key];
      amendArray(arr, x.length);
    }
  });
  Object.keys(recs).forEach(key => {
    if (!ys[key]) {
      assureKeys(key);
      ys[key] = [];
    }
    amendArray(ys[key], x.length);
    ys[key][x.length - 1] = recs[key];
  });

  keys.forEach((key, index) => {
    assureDataset(key, index, metadata);
    while(lineChartData.datasets[index].data.length < x.length){
      var idx = lineChartData.datasets[index].data.length;
      lineChartData.datasets[index].data.push(
        {
          x: x[idx],
          y: ys[key][idx]
        }
      );
    }
  });
  if (keys.length != keysLength) {
    reinitChart();
  }
  window.myLine.update();
}


function toggleColumn(set)
{
  if(keys.length == 0) {
    return;
  }
  if(hiddenSets[set]) {
    delete hiddenSets[set];
  } else {
    hiddenSets[set] = true;
    if(Array.from(Object.keys(hiddenSets)) == keys.length)
    {
      delete hiddenSets[keys[0]];
    }
  }
  keys.forEach((key, index) =>
    {
    if(hiddenSets[key]) {
      lineChartData.datasets[index].hidden = true;
    } else {
      lineChartData.datasets[index].hidden = false;
    }
  });
  window.myLine.update();
}

var lineChartData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    /*
      {
        label: 'Queries  XXXXX/ Seconds',
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
      },*/ /* {
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
  }, */
    /*
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
		 */
  ]
};

var lineChartOptions = {
  responsive: true,
  hoverMode: 'index',
  stacked: false,
  title: {
    display: false,
    text: 'Line Chart x/a'
  },
  scales: {
    xAxes: [{
      type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
      display: true,
      position: 'left',
      id: 'x-axis-1',
      label: 'time'
    }],
    yAxes: [ /*{
      type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
      display: true,
      position: 'right',
      ticks: {
        autoskip: true,
        max: 100,
        color: 'blue',
        fontColor: '#FF00FF', // this here
      },
      backgroundColor: window.chartColors.green,
      id: 'y-axis-1',
      labelString: '%CPU/%MEM',
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
      borderColor: window.chartColors.blue,
      backgroundColor: window.chartColors.blue,
      position: 'left',
      id: 'y-axis-3',
    } */
    ]
  }
};

function reinitChart () {
  var ctx = document.getElementById('canvas').getContext('2d');
  window.myLine = Chart.Line(ctx, {
    data: lineChartData,
    options: lineChartOptions
  });
}

/*
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
      position: 'right',
      ticks: {
      	autoskip: true,
      	max : 100,
      	color: "blue",
              fontColor: "#FF00FF", // this here
      },
      backgroundColor: window.chartColors.green,
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
*/

window.onload; // = reinitChart

function getRandomInt (max) {
  return Math.floor(Math.random() * Math.floor(max));
}
/*
 document.getElementById('updateQuery').addEventListener('click', function() {
   lineChartData.datasets.forEach(function(dataset) {
     dataset.data.push({ x: dataset.data.length, y : getRandomInt(8) })
   })
   window.myLine.update()
 })
 */
