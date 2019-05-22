$(function() {
    initStatData();

    statsSource.addEventListener('message', function (e) {
        if (document.querySelector('#pagePayments') !== null) {
            var stats = JSON.parse(e.data);

            for (var f = 0; f < poolKeys.length; f++) {
                var pool =  poolKeys[f];

                for (var i = 0; i < stats.pools[pool].payments.length; i++) {
                    var paymentstat = stats.pools[pool].payments[i];

                    var existingRow = document.querySelector('#payment' + pool + paymentstat.time);

                    if (existingRow == null) {
                        clearInterval(nextPaymentTimer);
                        paymentTimerOn = false;

                        //Add new
                        var insertPaymentTr = document.createElement('tr');
                        insertPaymentTr.id = 'payment' + pool + paymentstat.time;
                        insertPaymentTr.setAttribute('class', 'dynamicallyInserted');
                        insertPaymentTr.style.opacity = 0;
                        insertPaymentTr.style.transition = 'opacity 1s ease-in';

                        if (typeof paymentstat.txid !== 'undefined') {
                            var explorerlink = '<a href="' + explorerURL + 'tx/' + paymentstat.txid + '" target="_blank" rel="noopener noreferrer">' + paymentstat.blocks + '</a>';
                        } else {
                            var explorerlink = '<a>' + paymentstat.blocks + '</a>';
                        }

                        insertPaymentTr.innerHTML = '<td class="paymentblocks" title="Blocks:' + paymentstat.blocks.length + ' ' + paymentstat.opid + '">'
                            + '<span class="responsiveTableLabel"><i class="fas fa-link fa-fw"></i></span> <span>Blocks: [' + paymentstat.blocks.length + '] </span>'
                            + explorerlink + '<div class="fade">&#9660;</div></td>';
                        insertPaymentTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="far fa-clock fa-fw"></i> Time: </span>' + readableDate(paymentstat.time) + '</td>';
                        insertPaymentTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="fas fa-users fa-fw"></i> Miners: </span>' + paymentstat.miners + '</td>';
                        insertPaymentTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="fas fa-cog fa-fw"></i> Shares: </span>' + bigNumber(paymentstat.shares) + '</td>';
                        insertPaymentTr.innerHTML += '<td><span class="responsiveTableLabel"><i class="fas fa-money-bill-wave fa-fw"></i> Amount: </span>' + paymentstat.paid + ' ' + stats.pools[pool].symbol + '</td>';

                        var paymentTable = document.querySelector('#paymentTable' + pool + ' tbody');
                        if (paymentTable != null) {
                            paymentTable.insertBefore(insertPaymentTr, paymentTable.firstChild);
                            setTimeout(() => {
                                document.querySelectorAll('.dynamicallyInserted').forEach(function(newPayment) {
                                    newPayment.style.opacity = 1;
                                });
                            }, 25);
                            console.log('Added new payment!');
                        }
                    } else {
                        //Update existing (txid) for private chains 
                        if (typeof paymentstat.txid !== 'undefined' && (String(stats.pools[pool].name).startsWith("pirate") || String(stats.pools[pool].name).startsWith("arrr")) ) {
                            var explorer = 'https://explorer.pirate.black/tx/';
                            var paymentblock = document.querySelector('#payment' + pool + paymentstat.time + ' .paymentblocks a');

                            paymentblock.setAttribute('href', explorer + paymentstat.txid);
                            paymentblock.setAttribute('target', '_blank');
                            paymentblock.setAttribute('rel', 'noopener noreferrer');
                        }
                    }
                }

                //Global var from main.js - cleared on initStatData(), this needs to be started after the loop in case a new payment was added and old timer needs to be reset
                if (!paymentTimerOn) {
                    nextPaymentTimer = setInterval(function() {
                        var timeElement = document.querySelector('#statsNextPayment' + pool);
                        if (timeElement !== null) {
                            var timeleft=(paymentInterval-parseInt((new Date().getTime() - parseInt(stats.pools[pool].payments[0].time))/1000));
                            if (timeleft > 0) {
                                timeElement.innerHTML = timeTil(timeleft);
                                timeElement.setAttribute('title', timeTilNumbers(timeleft));
                            } else {
                                timeElement.innerHTML = 'Now';
                                timeElement.setAttribute('title', '00:00:00');
                            }
                        }
                    }, 1000);
                    paymentTimerOn = true;
                }
            }
        }
    });
});