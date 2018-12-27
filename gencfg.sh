#!/bin/bash
# Put the address to mine to here
walletaddress=RWEBo1Yp4uGkeXPi1ZGQARfLPkGmoW1MwY

#Change to path of komodo-cli here
komodoexec=~/komodo/src/komodo-cli

# Any coins you would like to skip go here
declare -a skip=("BEER" "PIZZA")

# Stratum port to start with
stratumport=3030

coinsdir=./coins
poolconfigdir=./pool_configs
coinstpl=coins.template
pooltpl=poolconfigs.template
ufwenablefile=stratufwenable
ufwdisablefile=stratufwdisable

cointemplate=$(<$coinstpl)
pooltemplate=$(<$pooltpl)

mkdir -p $coinsdir
mkdir -p $poolconfigdir

#clean old up
rm $ufwenablefile
rm $ufwdisablefile

~/komodo/src/listassetchains | while read chain; do
    conffile="~/.komodo/$chain/$chain.conf"

    if [[ " ${skip[@]} " =~ " ${chain} " ]] || [ ! -f $conffile ]; then
        pointless=0
    else
        thisconf=$(<$conffile)
        string=$(printf '%08x\n' $($komodoexec -ac_name=$chain getinfo | jq '.magic'))
        magic=${string: -8}
        magicrev=$(echo ${magic:6:2}${magic:4:2}${magic:2:2}${magic:0:2})

        p2pport=$($komodoexec -ac_name=$chain getinfo | jq '.p2pport')

        rpcuser=$(echo $thisconf | grep -Po "rpcuser=(\S*)" | sed 's/rpcuser=//')
        rpcpass=$(echo $thisconf | grep -Po "rpcpassword=(\S*)" | sed 's/rpcpassword=//')
        rpcport=$(echo $thisconf | grep -Po "rpcport=(\S*)" | sed 's/rpcport=//')

        echo "$cointemplate" | sed "s/COINNAMEVAR/$chain/" | sed "s/MAGICREVVAR/$magicrev/" > $coinsdir/$chain.json
        echo "$pooltemplate" | sed "s/P2PPORTVAR/$p2pport/" | sed "s/COINNAMEVAR/$chain/" | sed "s/WALLETADDRVAR/$walletaddress/" | sed "s/STRATUMPORTVAR/$stratumport/" | sed "s/RPCPORTVAR/$rpcport/" | sed "s/RPCUSERVAR/$rpcuser/" | sed "s/RPCPASSVAR/$rpcpass/" > $poolconfigdir/$chain.json

        echo "sudo ufw allow $stratumport comment 'Stratum $chain'" >> $ufwenablefile
        echo "sudo ufw delete allow $stratumport" >> $ufwdisablefile

        let "stratumport = $stratumport + 1"
    fi
done

chmod +x $ufwenablefile
chmod +x $ufwdisablefile
