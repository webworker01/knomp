## Mining stratum for Komodo and Komodo assetchains.
### (READY FOR TESTING - Share distribution needs testing)

Requirements
------------
* node v10+
* libsodium
* boost
* Redis (see https://redis.io/topics/quickstart for details)

Differences between this and Z-NOMP
------------
* This is meant for Komodo mining
* Founders, Treasury, and other ZEC/ZEN specific stuff is removed

Upgrade
-------------
* Please be sure to backup your `./coins` and `./pool_configs` directory before upgrading

Install
-------------
Some initial setup
```shell
# The following packages are needed to build both Komodo and this stratum:
sudo apt-get update
sudo apt-get install build-essential pkg-config libc6-dev m4 g++-multilib autoconf libtool ncurses-dev unzip git python python-zmq zlib1g-dev wget libcurl4-openssl-dev bsdmainutils automake curl libboost-dev libboost-system-dev libsodium-dev jq redis-server -y
```
Now, let's build Komodo
```shell
git clone https://github.com/jl777/komodo -b FSM
cd komodo
zcutil/fetch-params.sh
zcutil/build.sh -j8
```

We need to generate the coins files (coin daemon must be running!): `gencfg.sh <coin name>`

You can run just gencfg.sh with no coin name to use the assetchains.json in komodo/src directory for all coins. Make sure you edit the template with the correct values you want before running the config generator.

We need node and npminstalled

```shell
cd ~
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
```
Now, let's build our stratum and run it (this stage assumes you already have Redis properly installed and running)

```shell
git clone https://github.com/blackjok3rtt/knomp
cd knomp
npm install
npm start
```

## Disable Coinbase Mode 
This mode is enabled by default in the coins.template with`"disablecb" : true` 

To disable it, change the value to false. This mode uses -pubkey to tell the daemon where the coinbase should be sent, and uses the daemons coinbase transaction rather then having the pool create the coinabse transaction. This enables special coinbase transactions, such as ac_founders and ac_script or new modes with CC vouts in the coinbase not yet created, it will work with all coins, except Full Z support described below. 

The pool fee is taken in the payment processor using this mode, and might not be 100% accurate down to the single satoshi, so the pool address may end up with some small amount of coins over time. To use the pool fee, just change `rewardRecipents` value in the `poolconfig.template` before running the `gencfg.sh` script as you normally would for the standard mode.


Full Z Transaction Support
-------------
This is an option to force miners to use a Z address as their username for payouts

In your coins file add: 
```
"privateChain": true,
"burnFees": true
```

For the moment a different dependency is required, in package.json change the last dependency to: 
Edit: *This may be resolved and unneccesary now*
```
"stratum-pool": "git+https://github.com/webworker01/node-stratum-pool.git#notxfee"
```

Do this before running `npm install` above or stop your running instance and run `npm install` `npm start` again after making this change.

[Further info on config](https://github.com/zone117x/node-open-mining-portal)

License
-------

Forked from ComputerGenie repo (deleted)

Released under the GNU General Public License v2
http://www.gnu.org/licenses/gpl-2.0.html

_Forked from [z-classic/z-nomp](https://github.com/z-classic/z-nomp) which is incorrectly licensed under MIT License - see [zone117x/node-open-mining-portal](https://github.com/zone117x/node-open-mining-portal)_ 
