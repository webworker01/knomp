$(function() {
    initStatData(displayCharts);

    nv.utils.windowResize(triggerChartUpdates);

    statsSource.addEventListener('message', function (e) {
        if (document.querySelector('#pageStats') !== null) {
            var stats = JSON.parse(e.data);

            var newPoolAdded = (function(){
                for (var p in stats.pools){
                    if (poolKeys.indexOf(p) === -1)
                        return true;
                }
                return false;
            })();

            if (newPoolAdded || Object.keys(stats.pools).length > poolKeys.length) {
                buildChartData();
                displayCharts();
            } else {
                var time = stats.time * 1000;
                for (var f = 0; f < poolKeys.length; f++) {
                    var pool =  poolKeys[f];
                    for (var i = 0; i < poolHashrateData.length; i++) {
                        if (poolHashrateData[i].key === pool) {
                            if (time > lastHashrateUpdate[pool]) {
                                poolHashrateData[i].values.push([time, pool in stats.pools ? stats.pools[pool].hashrate : 0]);
                                poolHashrateData[i].values.shift();
                                $('#statsHashrateAvg' + pool).text(getReadableHashRateString(calculateAverageHashrate(pool)));
                                lastHashrateUpdate[pool] = time;
                            }
                            break;
                        }
                    }

                    /* Handle new found blocks */
                    var poolFoundList = document.querySelector('#blocksFound' + pool + ' .blocksFoundList');
                    if (poolFoundList != null) {
                        var pendingblocks = stats.pools[pool].pending.blocks;
                        var confirmedblocks = stats.pools[pool].confirmed.blocks;
                        var legitpending = [];
                        var legitconfirmed = [];
                        var prevHeight = 0;

                        document.querySelector('#blocksFoundHeaderCount' + pool).innerHTML = pendingblocks.length;

                        //Add new pending blocks
                        //@todo list starts from the heighest to lowest, if multiple blocks found in the same tick it inserts them backwards
                        for ( var block in pendingblocks ) {
                            var checkblock = pendingblocks[block].split(':');
                            legitpending.push(checkblock[0]);
                            var pendingBlockElement = document.querySelector('#blocksFoundPending' + checkblock[0]);
                            if (pendingBlockElement == null) {
                                var insertPendingBlock = document.createElement('div');
                                insertPendingBlock.id = 'blocksFoundPending' + checkblock[0];
                                insertPendingBlock.setAttribute('class', 'blocksFoundPending dynamicallyInserted');
                                insertPendingBlock.setAttribute('title', 'Waiting for payment processor to review');
                                insertPendingBlock.style.opacity = 0;
                                insertPendingBlock.style.transition = 'opacity 1s ease-in';
                                insertPendingBlock.innerHTML = '<div><i class="fas fa-link fa-fw"></i> <small>Block:</small> <a href="' + explorerURL + 'block/' + checkblock[0] + '" target="_blank" rel="noopener noreferrer">' + checkblock[2] + '</a><span style="padding-left: 10px;"><small>' + readableDate(checkblock[4]) + '</small></span><span class="countLabel">Pending</span></div><div><i class="fas fa-crown fa-fw"></i> <small>Mined By:</small> <a href="/workers/' + checkblock[3].split('.')[0] + '" class="minerAddress" title="' + checkblock[3] + '">' + middleEllipsis(checkblock[3]) + '</a></div>';

                                if (parseInt(checkblock[2]) > prevHeight) {
                                    poolFoundList.insertBefore(insertPendingBlock, poolFoundList.firstChild);
                                } else {
                                    poolFoundList.insertBefore(insertPendingBlock, poolFoundList.firstChild.nextSibling);
                                }
                                prevHeight = parseInt(checkblock[2]);
                                setTimeout(() => {
                                    document.querySelectorAll('.dynamicallyInserted').forEach(function(newBlock) {
                                        newBlock.style.opacity = 1;
                                    });
                                }, 25);
                            }
                        }

                        //Add new confirmed blocks
                        //@todo simplify duplicate logic
                        for ( var i = 7; i >= 0; i-- ) {
                            var checkblock = confirmedblocks[i].split(':');
                            legitconfirmed.push(checkblock[0]);
                            var confirmedBlockElement = document.querySelector('#blocksFoundPaid' + checkblock[0]);
                            if (confirmedBlockElement == null) {
                                var insertPendingBlock = document.createElement('div');
                                insertPendingBlock.id = 'blocksFoundPaid' + checkblock[0];
                                insertPendingBlock.setAttribute('class', 'blocksFoundPaid');
                                insertPendingBlock.setAttribute('title', 'Payment sent, please check payments page');
                                insertPendingBlock.innerHTML = '<div><i class="fas fa-link fa-fw"></i> <small>Block:</small> <a href="' + explorerURL + 'block/' + checkblock[0] + '" target="_blank" rel="noopener noreferrer">' + checkblock[2] + '</a><span style="padding-left: 10px;"><small>' + readableDate(checkblock[4]) + '</small></span><span class="countLabel">Pending</span></div><div><i class="fas fa-crown fa-fw"></i> <small>Mined By:</small> <a href="/workers/' + checkblock[3].split('.')[0] + '" class="minerAddress" title="' + checkblock[3] + '">' + middleEllipsis(checkblock[3]) + '</a></div>';

                                poolFoundList.insertBefore(insertPendingBlock, document.querySelectorAll('.blocksFoundList .blocksFoundPaid')[0]);
                            }
                        }

                        //Update confirms
                        var confirmblocks = stats.pools[pool].pending.confirms;
                        for ( var confirm in confirmblocks ) {
                            var labelElement = document.querySelector('#blocksFoundPending' + confirm + ' .countLabel');
                            labelElement.innerHTML = (confirmblocks[confirm] == "1") ? 'Need dPoW' : confirmblocks[confirm] + "/" + minConfirmations;
                        }

                        //Remove blocks no longer in pending/confirmed list
                        //Reselect found list because of possible inserts above
                        //Loop in reverse so there's no "confusion"
                        var poolFoundListChildren = document.querySelectorAll('#blocksFound' + pool + ' .blocksFoundList > div');
                        for ( var i = poolFoundListChildren.length-1; i >= 0; i--) {
                            var blockDivID = poolFoundListChildren[i].id
                            var blockDivCheckPending = blockDivID.replace('blocksFoundPending', '');
                            var blockDivCheckPaid = blockDivID.replace('blocksFoundPaid', '');
                            var blockDivElement = document.getElementById(blockDivID);

                            if (blockDivElement.classList.contains("blocksFoundPending") && legitpending.indexOf(blockDivCheckPending) < 0) {
                                document.getElementById(blockDivID).parentNode.removeChild(document.getElementById(blockDivID));
                            }

                            if (blockDivElement.classList.contains("blocksFoundPaid") && ( legitconfirmed.indexOf(blockDivCheckPaid) < 0 || legitconfirmed.indexOf(blockDivCheckPaid) > 7 ) ) {
                                document.getElementById(blockDivID).parentNode.removeChild(document.getElementById(blockDivID));
                            }
                        }
                    }
                }
                triggerChartUpdates();
            }
        }
    });
});

function displayCharts(){
    nv.addGraph(function() {
        poolHashrateChart = nv.models.lineChart()
            .margin({top:0, right: 30, bottom:15, left: 80})
            .x(function(d){ return d[0] })
            .y(function(d){ return d[1] })
            .useInteractiveGuideline(true);

        poolHashrateChart.xAxis.tickFormat(timeOfDayFormat);

        poolHashrateChart.yAxis.tickFormat(function(d){
            return getReadableHashRateString(d);
        });

        d3.select('#poolHashrate').datum(poolHashrateData).call(poolHashrateChart);

        return poolHashrateChart;
    });
}

function triggerChartUpdates(){
    poolHashrateChart.update();
}