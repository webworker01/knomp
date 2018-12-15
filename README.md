## Mining stratum for Komodo and Komodo assetchains.

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
git clone https://github.com/jl777/komodo -b dev
cd komodo
zcutil/fetch-params.sh
zcutil/build.sh -j8
strip src/komodod
strip src/komodo-cli
```
 Now, let's run the assets.
 - This will start ALL of the assets might take a day or so to sync, depending on system speed/network connection.
```shell
cd ~/komodo/src
./assetchains
```

 Once all these chains have synced up we can configure the stratum.

 We need node and npm installed

```shell
cd ~
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
```
Now, let's build our stratum and run it (this stage assumes you already have Redis properly installed and running)
This will install the stratum and configure it for all the assetchains on your system automatically. It must be run from the same user as the coin deamons were launched, as it pulls the rpcuser/pass from the conf file in the home directory.
```shell
git clone https://github.com/webworker01/knomp
cd knomp
./gencfg.sh
npm install
cp config_example.json config.json (and configure it)
npm start
```

Invalid Worker Addresses
-------------

You can add an option to your pool_config to have any miners that mine with an invalid address (if they somehow get through) to pay out to an address of your choosing
```
"invalidAddress":"zsValidAddressOfYourChoosingThatsNotThePoolZAddress"
```

Full Z Transaction Support (Sprout)
-------------
This is an option to force miners to use a Z address as their username for payouts

In your coins file add: 
```
"privateChain": true,
"burnFees": true
```

Sapling and Sapling Payment Support
-------------
In coins/pirate.json file:
```
"privateChain": true,
"burnFees": true,
"sapling": 152855
```
Please note, PIRATE sapling became active around 2018-12-15 01:15UTC at block 152855 Now that this has passed this can just be set to `"sapling":true` 

In pool_config:
```
"zAddress": "zsPoolsSaplingAddress",
"walletInterval": 2,
"validateWorkerUsername": true,
"paymentProcessing": {
        "minConf": 5,
        "paymentInterval": 180,
        "maxBlocksPerPayment": 20,
```

[Further info on config](https://github.com/zone117x/node-open-mining-portal) and [sample configs](https://github.com/z-classic/z-nomp)

License
-------

Forked from ComputerGenie repo (deleted)

Released under the GNU General Public License v2
http://www.gnu.org/licenses/gpl-2.0.html

_Forked from [z-classic/z-nomp](https://github.com/z-classic/z-nomp) which is incorrectly licensed under MIT License - see [zone117x/node-open-mining-portal](https://github.com/zone117x/node-open-mining-portal)_ 
