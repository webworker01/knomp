//Set this to match config for payment countdown
var explorerURL = 'https://explorer.pirate.black/';
var minConfirmations = 10;
var paymentInterval = 14400;

var nextPaymentTimer;
var paymentTimerOn = false;

var poolHashrateData;
var poolHashrateChart;
var lastHashrateUpdate = {};

var statData;
var poolKeys;

$(function(){
    initStatData();

    var hotSwap = function(page, pushSate){
        if (pushSate) history.pushState(null, null, '/' + page);
        $('.pure-menu-selected').removeClass('pure-menu-selected');
        $('a[href="/' + page + '"]').parent().addClass('pure-menu-selected');
        $.get("/get_page", {id: page}, function(data){
            $('main').html(data);
        }, 'html')
    };

    $('body').on('click', '.hot-swapper', function(event) {
        if (event.which !== 1) return;
        var pageId = $(this).attr('href').slice(1);
        hotSwap(pageId, true);
        event.preventDefault();
        return false;
    });

    window.addEventListener('load', function() {
        setTimeout(function() {
            window.addEventListener("popstate", function(e) {
                if (location.hash.length == 0) {
                    hotSwap(location.pathname.slice(1));
                }
            });
        }, 0);
    });

    window.statsSource = new EventSource("/api/live_stats");

    statsSource.addEventListener('message', function (e) {
        var stats = JSON.parse(e.data);
        var statpush = {};
        //Slim down the data we save to statData
        for (var pool in stats.pools) {
            statpush[pool] = {hashrate: stats.pools[pool].hashrate, workerCount: stats.pools[pool].workerCount, blocks: stats.pools[pool].blocks};
        }
        statData.push({time:stats.time, pools: statpush});
        statData.shift(); // remove old unused record

        for (var pool in stats.pools) {
            $('#statsMiners' + pool).text(stats.pools[pool].minerCount);
            $('#statsWorkers' + pool).text(stats.pools[pool].workerCount);
            $('#statsHashrate' + pool).text(stats.pools[pool].hashrateString);
            $('#statsHashrateAvg' + pool).text(getReadableHashRateString(calculateAverageHashrate(pool)));
            $('#statsLuckDays' + pool).text(stats.pools[pool].luckDays);
            $('#statsValidBlocks' + pool).text(parseInt(stats.pools[pool].poolStats.validBlocks).toLocaleString('en'));
            $('#statsTotalPaid' + pool).text(parseInt(stats.pools[pool].poolStats.totalPaid).toLocaleString('en'));
            $('#statsNetworkBlocks' + pool).text(stats.pools[pool].poolStats.networkBlocks);
            $('#statsNetworkDiff' + pool).text(bigNumber(stats.pools[pool].poolStats.networkDiff));
            $('#statsNetworkSols' + pool).text(getReadableNetworkHashRateString(stats.pools[pool].poolStats.networkSols));
            $('#statsNetworkConnections' + pool).text(stats.pools[pool].poolStats.networkConnections);
        }

        for (algo in stats.algos) {
            $('#statsMiners' + algo).text(stats.algos[algo].workers);
            $('#statsHashrate' + algo).text(stats.algos[algo].hashrateString);
        }
    });
});

function initStatData(callback) {
    clearInterval(nextPaymentTimer);
    paymentTimerOn = false;
    document.querySelectorAll('.nvtooltip').forEach(function(element) {
        element.remove();
    });
    if ( statData === undefined || statData.length == 0 ) {
        $.getJSON('/api/pool_stats', function(data){
            statData = data;
            buildChartData();
            if (typeof callback === "function") {
                callback();
            }
        });
    } else {
        buildChartData();
        if (typeof callback === "function") {
            callback();
        }
    }
}

function bigNumber(x) { 
    return (x > 1000000000000) ? (x / 1000000000000).toFixed(1) + 'T' : (x > 1000000000) ? (x / 1000000000).toFixed(1) + 'B' : (x > 1000000) ? (x / 1000000).toFixed(1) + 'M'  : (x > 1000) ? (x / 1000).toFixed(1) + 'K' : x.toFixed(1);
}

function buildChartData() {
    var pools = {};

    poolKeys = [];
    for (var i = 0; i < statData.length; i++){
        for (var pool in statData[i].pools){
            if (poolKeys.indexOf(pool) === -1) {
                poolKeys.push(pool);
                lastHashrateUpdate[pool] = 0;
            }
        }
    }

    for (var i = 0; i < statData.length; i++) {
        var time = statData[i].time * 1000;
		for (var f = 0; f < poolKeys.length; f++){
            var pName = poolKeys[f];
            var a = pools[pName] = (pools[pName] || {
                hashrate: []
            });
            if (pName in statData[i].pools){
                a.hashrate.push([time, statData[i].pools[pName].hashrate]);
            } else {
                a.hashrate.push([time, 0]);
            }
        }
    }

    poolHashrateData = [];
    for (var pool in pools){
       poolHashrateData.push({
            key: pool,
            values: pools[pool].hashrate
        });
		$('#statsHashrateAvg' + pool).text(getReadableHashRateString(calculateAverageHashrate(pool)));
    }
}

function calculateAverageHashrate(pool) {
    var count = 0;
    var total = 1;
    var avg = 0;
    for (var i = 0; i < poolHashrateData.length; i++) {
        count = 0;
        for (var ii = 0; ii < poolHashrateData[i].values.length; ii++) {
            if (pool == null || poolHashrateData[i].key === pool) {
                count++;
                avg += parseFloat(poolHashrateData[i].values[ii][1]);
            }
        }
        if (count > total)
            total = count;
    }
    avg = avg / total;
    return avg;
}

function getReadableHashRateString(hashrate){
	hashrate = (hashrate * 2);
	if (hashrate < 1000000) {
		return (Math.round(hashrate / 1000) / 1000 ).toFixed(2)+' Sol/s';
	}
    var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
    var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
    hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
}

function getReadableNetworkHashRateString(hashrate){
    hashrate = (hashrate * 1000000);
    if (hashrate < 1000000)
        return '0 Sol';
    var byteUnits = [ ' Sol/s', ' KSol/s', ' MSol/s', ' GSol/s', ' TSol/s', ' PSol/s' ];
    var i = Math.floor((Math.log(hashrate/1000) / Math.log(1000)) - 1);
    hashrate = (hashrate/1000) / Math.pow(1000, i + 1);
    return hashrate.toFixed(2) + byteUnits[i];
}

function middleEllipsis(x, cutlength) {
    if (typeof cutlength == 'undefined') {
        var cutlength=15;
    }
    return x.length > 40 ? x.substring(0, cutlength) + '...' + x.substring(x.length-cutlength, x.length): x; 
}

function readableDate(a){ 
    return new Date(parseInt(a)).toISOString().substring(0, 16).replace('T', ' ') + ' UTC'; 
} 

function timeOfDayFormat(timestamp){
    return new Date(parseInt(timestamp)).toISOString().substring(11, 16); 
}

function timeTil(timestamp) {
    return (timestamp > 86400) ? (timestamp/86400).toFixed(1) + ' Days' : (timestamp > 3600) ? (timestamp/3600).toFixed(1) + ' Hours' : (timestamp > 60) ? (timestamp / 60).toFixed(1) + ' Minutes' : timestamp + ' Seconds'; 
}

function timeTilNumbers(timestamp) {
    return new Date(timestamp * 1000).toISOString().substr(11, 8);
}

function zeroOrGreater(value) {
    return (value < 0) ? 0 : value;
}