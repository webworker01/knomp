var workerHashrateData;
var workerHashrateChart;
var workerHistoryMax = 160;

var minerStatData;
var totalHash;
var totalImmature;
var totalBal;
var totalPaid;
var totalShares;

$(function() {
    // resize chart on window resize
    nv.utils.windowResize(triggerMinerChartUpdates);

    // grab initial stats
    $.getJSON('/api/worker_stats?'+_miner, function(data){
        minerStatData = data;
        for (var w in minerStatData.workers) { _workerCount++; }
        buildMinerChartData();
        displayMinerCharts();
        rebuildWorkerDisplay();	
        updateMinerStats();
    });

    // live stat updates
    statsSource.addEventListener('message', function(e){
        if (document.querySelector('#pageMiner') !== null) {
            // TODO, create miner_live_stats...
            // miner_live_stats will return the same josn except without the worker history
            // FOR NOW, use this to grab updated stats
            $.getJSON('/api/worker_stats?'+_miner, function(data){
                minerStatData = data;
                // check for missing workers
                var wc = 0;
                var rebuilt = false;
                // update worker stats
                for (var w in minerStatData.workers) { wc++; }
                // TODO, this isn't 100% fool proof!
                if (_workerCount != wc) {
                    if (_workerCount > wc) {
                        rebuildWorkerDisplay();
                        rebuilt = true;
                    }
                    _workerCount = wc;
                }
                rebuilt = (rebuilt || updateMinerChartData());
                updateMinerStats();
                if (!rebuilt) {
                    updateWorkerStats();
                }
            });

            var stats = JSON.parse(e.data);
        }
    });
});

function getWorkerNameFromAddress(w) {
	var worker = w;
	if (w.split(".").length > 1) {
		worker = w.split(".")[1];
		if (worker == null || worker.length < 1) {
			worker = "noname";
		}
	} else {
		worker = "noname";
	}
	return worker;
}

function buildMinerChartData(){
    var workers = {};
	for (var w in minerStatData.history) {
		var worker = getWorkerNameFromAddress(w);
		var a = workers[worker] = (workers[worker] || {
			hashrate: []
		});
		for (var wh in minerStatData.history[w]) {
			a.hashrate.push([minerStatData.history[w][wh].time * 1000, minerStatData.history[w][wh].hashrate]);
		}
		if (a.hashrate.length > workerHistoryMax) {
			workerHistoryMax = a.hashrate.length;
		}
	}
	
	var i=0;
    workerHashrateData = [];
    for (var worker in workers){
        workerHashrateData.push({
            key: worker,
			//disabled: (i > Math.min((_workerCount-1), 3)),
			disabled: false,
            values: workers[worker].hashrate
        });
		i++;
    }
}

function updateMinerChartData(){
    var workers = {};
	for (var w in minerStatData.history) {
		var worker = getWorkerNameFromAddress(w);
		// get a reference to lastest workerhistory
		for (var wh in minerStatData.history[w]) { }
		//var wh = minerStatData.history[w][minerStatData.history[w].length - 1];
		var foundWorker = false;
		for (var i = 0; i < workerHashrateData.length; i++) {
			if (workerHashrateData[i].key === worker) {
				foundWorker = true;
				if (workerHashrateData[i].values.length >= workerHistoryMax) {
					workerHashrateData[i].values.shift();
				}
				workerHashrateData[i].values.push([minerStatData.history[w][wh].time * 1000, minerStatData.history[w][wh].hashrate]);
				break;
			}
		}
		if (!foundWorker) {
			var hashrate = [];
			hashrate.push([minerStatData.history[w][wh].time * 1000, minerStatData.history[w][wh].hashrate]);
			workerHashrateData.push({
				key: worker,
				values: hashrate
			});
			rebuildWorkerDisplay();
			return true;
		}
	}
	triggerMinerChartUpdates();
	return false;
}

function calculateAverageMinerHashrate(worker) {
	var count = 0;
	var total = 1;
	var avg = 0;
	for (var i = 0; i < workerHashrateData.length; i++) {
		count = 0;
		for (var ii = 0; ii < workerHashrateData[i].values.length; ii++) {
			if (worker == null || workerHashrateData[i].key === worker) {
				count++;
				avg += parseFloat(workerHashrateData[i].values[ii][1]);
			}
		}
		if (count > total)
			total = count;
	}
	avg = avg / total;
	return avg;
}

function triggerMinerChartUpdates(){
    workerHashrateChart.update();
}

function displayMinerCharts() {
    nv.addGraph(function() {
        workerHashrateChart = nv.models.lineChart()
            .margin({left: 80, right: 30})
            .x(function(d){ return d[0] })
            .y(function(d){ return d[1] })
            .useInteractiveGuideline(true);

        workerHashrateChart.xAxis.tickFormat(timeOfDayFormat);

        workerHashrateChart.yAxis.tickFormat(function(d){
            return getReadableHashRateString(d);
        });
        d3.select('#workerHashrate').datum(workerHashrateData).call(workerHashrateChart);
        return workerHashrateChart;
    });
}

function updateMinerStats() {
	totalHash = minerStatData.totalHash;
	totalPaid = minerStatData.paid;
	totalBal = minerStatData.balance;
	totalImmature = minerStatData.immature;
	totalShares = minerStatData.totalShares;
	// do some calculations
	var _blocktime = 250;
	var _networkHashRate = parseFloat(minerStatData.networkSols) * 1.2;
	var _myHashRate = (totalHash / 1000000) * 2;
	var luckDays =  ((_networkHashRate / _myHashRate * _blocktime) / (24 * 60 * 60)).toFixed(3);
	// update miner stats
	$("#statsHashrate").text(getReadableHashRateString(totalHash));
	$("#statsHashrateAvg").text(getReadableHashRateString(calculateAverageMinerHashrate(null)));
	$("#statsLuckDays").text(luckDays);
	$("#statsTotalImmature").text(totalImmature);
	$("#statsTotalBal").text(totalBal);
	$("#statsTotalPaid").text(totalPaid);
	$("#statsTotalShares").text(bigNumber(totalShares));
}

function updateWorkerStats() {
	// update worker stats
	var i=0;
	for (var w in minerStatData.workers) { i++;
		var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
		var saneWorkerName = getWorkerNameFromAddress(w);
		$("#statsHashrate"+htmlSafeWorkerName).text(getReadableHashRateString(minerStatData.workers[w].hashrate));
		$("#statsHashrateAvg"+htmlSafeWorkerName).text(getReadableHashRateString(calculateAverageMinerHashrate(saneWorkerName)));
		$("#statsLuckDays"+htmlSafeWorkerName).text(minerStatData.workers[w].luckDays);
		$("#statsPaid"+htmlSafeWorkerName).text(minerStatData.workers[w].paid);
		$("#statsBalance"+htmlSafeWorkerName).text(minerStatData.workers[w].balance);
		$("#statsShares"+htmlSafeWorkerName).text(bigNumber(minerStatData.workers[w].currRoundShares));
		$("#statsDiff"+htmlSafeWorkerName).text(bigNumber(zeroOrGreater(minerStatData.workers[w].diff)));
	}
}

function addWorkerToDisplay(name, htmlSafeName, workerObj) {
	var htmlToAdd = "";
	htmlToAdd ='<div class="pure-u-1-4 pure-responsive-disable"><div class="l-box">';
    htmlToAdd+='<h3 class="boxLowerHeader">';
	htmlToAdd+=(htmlSafeName.indexOf("_") >= 0) ? htmlSafeName.substr(htmlSafeName.indexOf("_")+1,htmlSafeName.length) : 'noname';
    htmlToAdd+='</h3>';
    htmlToAdd+='<div class="boxStatsList"><ul>';
	htmlToAdd+='<li><i class="fas fa-tachometer-alt fa-fw"></i> <span id="statsHashrate'+htmlSafeName+'">'+getReadableHashRateString(workerObj.hashrate)+'</span> (Now)</li>';
	htmlToAdd+='<li><i class="fas fa-tachometer-alt fa-fw"></i> <span id="statsHashrateAvg'+htmlSafeName+'">'+getReadableHashRateString(calculateAverageMinerHashrate(name))+'</span> (Avg)</li>';
	htmlToAdd+='<li><i class="fas fa-unlock-alt fa-fw"></i> Diff: <span id="statsDiff'+htmlSafeName+'">'+bigNumber(zeroOrGreater(workerObj.diff))+'</span></li>';
	htmlToAdd+='<li><i class="fas fa-cog fa-fw"></i> Shares: <span id="statsShares'+htmlSafeName+'">'+bigNumber(workerObj.currRoundShares)+'</span></li>';
	htmlToAdd+='<li><i class="fas fa-dice fa-fw"></i> Luck <span id="statsLuckDays'+htmlSafeName+'">'+workerObj.luckDays+'</span> Days</li>';
	htmlToAdd+='<li><i class="fas fa-piggy-bank fa-fw"></i> Bal: <span id="statsBalance'+htmlSafeName+'">'+workerObj.balance+'</span></li>';
	htmlToAdd+='<li><i class="fas fa-money-bill-wave fa-fw"></i> Paid: <span id="statsPaid'+htmlSafeName+'">'+workerObj.paid+'</span></li>';
	htmlToAdd+='</ul></div></div></div>';
	$("#boxesWorkers").html($("#boxesWorkers").html()+htmlToAdd);
}

function rebuildWorkerDisplay() {
	$("#boxesWorkers").html("");
	var i=0;
	for (var w in minerStatData.workers) { i++;
		var htmlSafeWorkerName = w.split('.').join('_').replace(/[^\w\s]/gi, '');
		var saneWorkerName = getWorkerNameFromAddress(w);
		addWorkerToDisplay(saneWorkerName, htmlSafeWorkerName, minerStatData.workers[w]);
	}
}
