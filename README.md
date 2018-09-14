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

Install
-------------
Some initial setup
```shell
# The following packages are needed to build both Komodo and this stratum:
sudo apt-get update
sudo apt-get install build-essential pkg-config libc6-dev m4 g++-multilib autoconf libtool ncurses-dev unzip git python python-zmq zlib1g-dev wget libcurl4-openssl-dev bsdmainutils automake curl libboost-dev libboost-system-dev libsodium-dev -y
```
Now, let's build Komodo
```shell
git clone https://github.com/StakedChain/komodo
cd komodo
zcutil/fetch-params.sh
zcutil/build.sh -j8
```

https://raw.githubusercontent.com/StakedChain/PoS_scripts/master/pool_cfg_generator/gencfg.sh

That script will generate the pool config for you. Edit the address to the address you want to mine to and check the folders point to wher Knomp is installed. The default directories are already there. There is also the stratum port, each coin needs a diffrent port. 

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

[Further info on config](https://github.com/zone117x/node-open-mining-portal)

License
-------

Forked from ComputerGenie repo (deleted)

Released under the GNU General Public License v2
http://www.gnu.org/licenses/gpl-2.0.html

_Forked from [z-classic/z-nomp](https://github.com/z-classic/z-nomp) which is licensed under MIT License (See Old/LICENSE file)_
