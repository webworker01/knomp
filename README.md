## Mining stratum for Komodo and Komodo assetchains.
## (READY FOR TESTING)

Requirements
------------
* node v8+
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
git clone https://github.com/jl777/komodo -b dev
cd komodo
zcutil/fetch-params.sh
zcutil/build.sh -j8
strip src/komodod
strip src/komodo-cli
```
 Now, let's run an asset to mine (MGNX in this case)
```shell
cd ~/komodo/src
./komodod -ac_name=MGNX -ac_supply=12000000 -ac_staked=90 -ac_reward=2000000000 -ac_halving=525960 -ac_cc=2 -ac_end=2629800 -addnode=45.32.236.224 -gen -genproclimit=1 &
```
To check on our Assetchain status, we use something like:
```shell
# You always need to add ac_name to the cli or it will poll komodod for KMD
cd ~/komodo/src
./komodo-cli -ac_name=MGNX getwalletinfo
```
 We need npm and mvn installed

```shell
cd ~
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
nvm install 8
```
Now, let's build our stratum and run it (this stage assumes you already have Redis properly installed and running)
```shell
git clone https://github.com/TheComputerGenie/Knomp
cd Knomp
nvm use 8
npm install
npm start
```

License
-------
Released under the GNU General Public License v2
http://www.gnu.org/licenses/gpl-2.0.html

_Forked from [z-classic/z-nomp](https://github.com/z-classic/z-nomp) which is licensed under MIT License (See Old/LICENSE file)_