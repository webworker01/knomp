var fs = require('fs');
var request = require('request');

var redis = require('redis');
var async = require('async');

var Stratum = require('stratum-pool');
var util = require('stratum-pool/lib/util.js');

module.exports = function(logger){
    var poolConfigs = JSON.parse(process.env.pools);

    var enabledPools = [];

    Object.keys(poolConfigs).forEach(function(coin) {
        enabledPools.push(coin);
    });

    async.filter(enabledPools, function(coin, callback){
        SetupForStats(logger, poolConfigs[coin], function(setupResults){
            callback(null, setupResults);
        });
    }, function(err, results){
        results.forEach(function(coin){

            var poolOptions = poolConfigs[coin];
            var daemonConfig = poolOptions.daemons[0];

            var logSystem = 'Payments';
            var logComponent = coin;

            logger.debug(logSystem, logComponent, 'Network stats setup with daemon ('
                + daemonConfig.user + '@' + daemonConfig.host + ':' + daemonConfig.port
                + ') and redis (' + poolOptions.redis.host + ':' + poolOptions.redis.port + ')');                
        });
    });
};

function SetupForStats(logger, poolOptions, setupFinished) {

    var coin = poolOptions.coin.name;
    var daemonConfig = poolOptions.daemons[0];

    var getMarketStats = poolOptions.coin.getMarketStats === true;

    var logSystem = 'Payments';
    var logComponent = coin;

    var daemon = new Stratum.daemon.interface([daemonConfig], function(severity, message){
        logger[severity](logSystem, logComponent, message);
    });

    var redisClient = redis.createClient(poolOptions.redis.port, poolOptions.redis.host);
    // redis auth if enabled
    if (poolOptions.redis.password) {
        redisClient.auth(poolOptions.redis.password);
    }

    function cacheNetworkStats () {
        var params = null;
        daemon.cmd('getmininginfo', params,
            function (result) {
                if (!result || result.error || result[0].error || !result[0].response) {
                    logger.error(logSystem, logComponent, 'Error with RPC call getmininginfo '+JSON.stringify(result[0].error));
                    return;
                }

                var coin = logComponent;
                var finalRedisCommands = [];

                if (result[0].response.blocks !== null) {
                    finalRedisCommands.push(['hset', coin + ':stats', 'networkBlocks', result[0].response.blocks]);
                }
                if (result[0].response.difficulty !== null) {
                    finalRedisCommands.push(['hset', coin + ':stats', 'networkDiff', result[0].response.difficulty.toFixed(2)]);
                }
                if (result[0].response.networkhashps !== null) {
                    finalRedisCommands.push(['hset', coin + ':stats', 'networkSols', result[0].response.networkhashps]);
                }

                daemon.cmd('getnetworkinfo', params,
                    function (result) {
                        if (!result || result.error || result[0].error || !result[0].response) {
                            logger.error(logSystem, logComponent, 'Error with RPC call getnetworkinfo '+JSON.stringify(result[0].error));
                            return;
                        }

                        if (result[0].response.connections !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkConnections', result[0].response.connections]);
                        }
                        if (result[0].response.version !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkVersion', result[0].response.version]);
                        }
                        if (result[0].response.subversion !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkSubVersion', result[0].response.subversion]);
                        }
                        if (result[0].response.protocolversion !== null) {
                            finalRedisCommands.push(['hset', coin + ':stats', 'networkProtocolVersion', result[0].response.protocolversion]);
                        }

                        if (finalRedisCommands.length <= 0)
                            return;

                        redisClient.multi(finalRedisCommands).exec(function(error, results){
                            if (error){
                                logger.error(logSystem, logComponent, 'Error with redis during call to cacheNetworkStats() ' + JSON.stringify(error));
                                return;
                            }
                        });
                    }
                );
            }
        );
    }

    function cacheMarketStats() {
        var marketStatsUpdate = [];
        var coin = logComponent.replace('_testnet', '').toLowerCase();
        if (coin == 'zen')
            coin = 'zencash';
        
        request('https://api.coinmarketcap.com/v1/ticker/'+coin+'/', function (error, response, body) {
            if (error) {
                logger.error(logSystem, logComponent, 'Error with http request to https://api.coinmarketcap.com/ ' + JSON.stringify(error));
                return;
            }
            if (response && response.statusCode) {
                if (response.statusCode == 200) {
                    if (body) {
                        var data = JSON.parse(body);
                        if (data.length > 0) {
                            marketStatsUpdate.push(['hset', logComponent + ':stats', 'coinmarketcap', JSON.stringify(data)]);
                            redisClient.multi(marketStatsUpdate).exec(function(err, results){
                                if (err){
                                    logger.error(logSystem, logComponent, 'Error with redis during call to cacheMarketStats() ' + JSON.stringify(error));
                                    return;
                                }
                            });
                        }
                    }
                } else {
                    logger.error(logSystem, logComponent, 'Error, unexpected http status code during call to cacheMarketStats() ' + JSON.stringify(response.statusCode));
                }
            }
        });
    }

    // network stats caching every 58 seconds
    var stats_interval = 58 * 1000;
    var statsInterval = setInterval(function() {
        // update network stats using coin daemon
        cacheNetworkStats();
    }, stats_interval);

    // market stats caching every 5 minutes
    if (getMarketStats === true) {
        var market_stats_interval = 300 * 1000;
        var marketStatsInterval = setInterval(function() {
            // update market stats using coinmarketcap
            cacheMarketStats();
        }, market_stats_interval);
    }
}
