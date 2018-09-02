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
                    finalRedisCommands.push(['hset', coin + ':stats', 'networkDiff', result[0].response.difficulty]);
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

    // network stats caching every 58 seconds
    var stats_interval = 58 * 1000;
    var statsInterval = setInterval(function() {
        // update network stats using coin daemon
        cacheNetworkStats();
    }, stats_interval);
}
