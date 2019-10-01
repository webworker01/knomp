$(function() {
    initStatData();

    $('.btn-lg').click(function(){
        window.location = "workers/" + $('.input-lg').val();
    });

    statsSource.addEventListener('message', function (e) {
        if (document.querySelector('#pageWorkers') !== null) {
            var stats = JSON.parse(e.data);
            for (var f = 0; f < poolKeys.length; f++) {
                var pool =  poolKeys[f];
                var sharesTotal = 0;
                var minerIndex = 0;

                for (var addr in stats.pools[pool].miners) {
                    minerIndex++;
                    var workerstat = stats.pools[pool].miners[addr];
                    sharesTotal += parseFloat(workerstat.shares);
                    var existingRow = document.querySelector('#workers' + pool + ' #miner-' + minerIndex);
                    var minerEfficiency = ( workerstat.shares > 0 ) ? Math.floor(10000 * workerstat.shares / (workerstat.shares + workerstat.invalidshares)) / 100 : 0;

                    if (existingRow == null) {
                        //Add new
                        var insertMinerTr = document.createElement('tr');
                        insertMinerTr.id = 'miner-' + minerIndex;
                        insertMinerTr.setAttribute('data-hashrate', workerstat.hashrate);
                        insertMinerTr.innerHTML = '<td><span class="responsiveTableLabel"><i class="far fa-address-card fa-fw"></i></span>Miner #'+ minerIndex +'</td>';
                        insertMinerTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="fas fa-cog fa-fw"></i> Shares: </span><span>' + bigNumber(workerstat.shares) + '</span></td>';
                        insertMinerTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="fas fa-bullseye fa-fw"></i> Efficiency: </span><span> ' + minerEfficiency + '%</span></td>';
                        insertMinerTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="fas fa-tachometer-alt fa-fw"></i> Hashrate: </span><span>' + workerstat.hashrateString + '</span></td>';

                        document.querySelector('#workers' + pool + ' .poolMinerTable tbody').appendChild(insertMinerTr);

                        console.log('Added new miner! [' + minerIndex + ']');
                    } else {
                        //Update existing
                        document.querySelector('#workers' + pool + ' #miner-' + minerIndex + ' td:nth-child(2) span:nth-child(2)').innerHTML = bigNumber(workerstat.shares);
                        document.querySelector('#workers' + pool + ' #miner-' + minerIndex + ' td:nth-child(3) span:nth-child(2)').innerHTML = minerEfficiency + '%';
                        document.querySelector('#workers' + pool + ' #miner-' + minerIndex + ' td:nth-child(4) span:nth-child(2)').innerHTML = workerstat.hashrateString;
                        document.querySelector('#workers' + pool + ' #miner-' + minerIndex).setAttribute('data-hashrate', workerstat.hashrate);
                    }
                }

                document.querySelector('#statsShares' + pool).innerHTML = bigNumber(sharesTotal);

                //Remove inactive
                var workerList = document.querySelectorAll('#workers' + pool + ' .poolMinerTable tbody tr');
                for ( var i = workerList.length-1; i >= 0; i--) {
                    var workerTrID = workerList[i].id.substring(6);

                    if( typeof stats.pools[pool].miners[workerTrID] == 'undefined') {
                        console.log('Removing miner :( [' + workerTrID + ']');
                        workerList[i].parentNode.removeChild(workerList[i]);
                    }
                }

                //Resort table
                var table = document.querySelector('#workers' + pool + ' table.poolMinerTable tbody');
                var rows = document.querySelectorAll('#workers' + pool + ' table.poolMinerTable tbody tr');
                var rowsArr = [].slice.call(rows).sort(function (a, b) {
                    return (parseFloat(a.dataset.hashrate) == parseFloat(b.dataset.hashrate)) ? 0 : ((parseFloat(a.dataset.hashrate) < parseFloat(b.dataset.hashrate)) ? 1 : -1);
                });
                for (var i = 0; i < rowsArr.length; i++){ table.append(rowsArr[i]); }
            }
        }
    });
});

function searchKeyPress(e)
{
    // look for window.event in case event isn't passed in
    e = e || window.event;
    if (e.keyCode == 13)
    {
        document.getElementById('btnSearch').click();
        return false;
    }
    return true;
}
